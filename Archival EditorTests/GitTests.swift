//
//  GitTests.swift
//  Archival EditorTests
//
//  Created by Jesse Ditson on 2/16/22.
//

import XCTest
@testable import Archival_Editor

class GitTests: XCTestCase {

    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }

    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    func testCloneAndRebase() throws {
        let git = Git(repo: "https://github.com/jesseditson/archival-docs.git")
        git.sync()
    }

}
