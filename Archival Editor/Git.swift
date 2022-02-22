//
//  Git.swift
//  Archival Editor
//
//  Created by Jesse Ditson on 2/15/22.
//

import Foundation
import SwiftGit2
import Clibgit2

let documentURL = try! FileManager.default.url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: true)


class Git {
    let localRepoLocation: URL
    let remoteRepoLocation: URL
    var cloned = false
    
    init(repo: String) {
        let localName = URL(fileURLWithPath: repo).deletingPathExtension().lastPathComponent
        localRepoLocation = documentURL.appendingPathComponent(localName)
        remoteRepoLocation = URL(string: repo)!
        
        // git_libgit2_init()
        Repository.initialize_libgit2()
        if FileManager.default.fileExists(atPath: localRepoLocation.absoluteString) {
            cloned = true
        }
        
        clone()
    }
    
    func clone(force: Bool = false) {
        let exists = FileManager.default.fileExists(atPath: localRepoLocation.absoluteString)
        if exists && !force {
            return
        }
        if exists {
            try! FileManager.default.removeItem(at: localRepoLocation)
        }
        let result = Repository.clone(from: remoteRepoLocation, to: localRepoLocation)
        switch result {
        case let .success(repo):
            let latestCommit = repo
                .HEAD()
                .flatMap {
                    repo.commit($0.oid)
                }
            cloned = true

            switch latestCommit {
            case let .success(commit):
                print("Latest Commit: \(commit.message) by \(commit.author.name)")

            case let .failure(error):
                print("Could not get commit: \(error)")
            }

        case let .failure(error):
            print("Could not clone repository: \(error)")
            cloned = false
        }
    }
    
    func sync() {
        if !cloned {
            clone()
        }
        let repo = try! Repository.at(localRepoLocation).get()
        let remote = try! repo.remote(named: "origin").get()
        try! repo.fetch(remote).get()
        rebase(remote: remote, onto: repo)
    }
}

private func rebase(remote: Remote, onto local: Repository) -> Void {
    var opts = git_rebase_options()
    opts.inmemory = 1;
    opts.merge_options.flags |= GIT_MERGE_FAIL_ON_CONFLICT.rawValue;
    opts.merge_options.flags |= GIT_MERGE_NO_RECURSIVE.rawValue;
    opts.merge_options.flags |= GIT_MERGE_SKIP_REUC.rawValue;
    // get an annotated commit for the head commit of the main local branch
    var bpl: OpaquePointer? = nil
    assert(git_reference_lookup(&bpl, local.pointer, "refs/heads/main") == GIT_OK.rawValue)
    var base: OpaquePointer? = nil
    var hp: OpaquePointer? = nil
    assert(git_repository_head(&hp, local.pointer) == GIT_OK.rawValue)
    assert(git_annotated_commit_lookup(&base, local.pointer, git_reference_target(hp)) == GIT_OK.rawValue)
    var rpr: OpaquePointer? = nil
    assert(git_remote_lookup(&rpr, local.pointer, "origin") == GIT_OK.rawValue)
//    var bnp: git_buf = git_buf()
//    assert(git_branch_upstream_remote(&bnp, local.pointer, "refs/heads/main") == GIT_OK.rawValue)
//    let branchName = String(cString: bnp.ptr)
    var bpr: OpaquePointer? = nil
    assert(git_branch_lookup(&bpr, local.pointer, "origin/main", GIT_BRANCH_REMOTE) == GIT_OK.rawValue)
    var rp: OpaquePointer? = nil
    assert(git_rebase_init(&rp, local.pointer, nil, nil, nil, nil) == GIT_OK.rawValue)
    var op: UnsafeMutablePointer<git_rebase_operation>? = nil
    repeat {} while (git_rebase_next(&op, rp) == GIT_OK.rawValue)
    assert(git_rebase_finish(rp, nil) == GIT_OK.rawValue)
    git_reference_free(bpl)
    git_reference_free(rpr)
    git_rebase_free(rp)
}
