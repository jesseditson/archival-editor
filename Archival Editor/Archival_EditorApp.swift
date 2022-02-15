//
//  Archival_EditorApp.swift
//  Archival Editor
//
//  Created by Jesse Ditson on 2/15/22.
//

import SwiftUI

@main
struct Archival_EditorApp: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
