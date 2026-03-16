


import { steamAPI } from "$lib/steam"
import { db } from "$lib/data"



// algorithm.js
// by Aaron Meche

// Algorithm Class

export class Algorithm {
    constructor(algrID = "Default") {
        this.algrID = algrID
        this.brain = {
            // Objective Data
            library: [],
            appdata: {},
            recplay: [],
            // Preferences
            genres:     { positive: [], negative: [] },
            rated:      { positive: [], negative: [] },
            descriptors:{ positive: [], negative: [] },
        }
    }

    // ingestLibrary
    // > input:  array of owned games
    // . action: add each game to brain library
    // < output: none
    ingestLibrary(games = []) {
        console.log("Ingesting library...")
        games.forEach(g => {
            if (!g.appid) console.error("Game ingestion failure: missing app id.")
            this.brain.library.push({
                appid: g.appid,
                playtime: g.playtime_forever || null,
                lastplay: g.rtime_last_played || null,
            })
            this.brain.appdata[g.appid] = {}
        })
        this.#updateAppData()
    }

    assemble() {
        console.log("Algorithm Assembly...")
        const unsub = db.subscribe(data => {
            if (Object.keys(data.algr).length > 0) {
                this.brain = data.algr
                console.log("Already Assembled. Brain Transplant", this)
            }
            else {
                console.log("Beginning Assembly...")
                steamAPI.getOwnedGames(ret => {
                    this.ingestLibrary(ret?.response?.games)
                })
            }
        })
        unsub()
    }

    async #updateAppData() {
        console.log("Updating App Data...")
        let apps = Object.keys(this.brain.appdata)
        let appsToCall = []
        for (const app of apps) {
            // Check if data stored in brain @ appdata @ appid
            if (Object.keys(this.brain.appdata[app]).length > 0) {
                console.log("Log Exists", app, this.brain.appdata[app])
                continue
            }
            await new Promise(resolve => {
                steamAPI.getGameDetails(app, ret => {
                    this.brain.appdata[app] = ret[app].data
                    resolve()
                })
            })
        }
        this.#updateStorage()
    }

    #updateStorage() {
        console.log("Updating Algr Storage")
        db.update(data => {
            data.algr = this
            return data
        })
    }

    printContents() {
        console.log(this.brain)
        return JSON.stringify(this.brain)
    }
}