import { makeAutoObservable } from "mobx"

export default class Editor {
    constructor() {
        makeAutoObservable(this)
    }
}
