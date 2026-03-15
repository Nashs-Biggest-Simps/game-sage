






// algorithm.js
// by Aaron Meche

// Algorithm Class

export class Algorithm {
    constructor(userID = null) {
        this.userID = userID
        this.brain = {
            // Objective Data
            library: [],
            recplay: [],
            // Preferences
            genres:     { positive: [], negative: [] },
            rated:      { positive: [], negative: [] },
            descriptors:{ positive: [], negative: [] },
        }
    }

    ingestLibrary(games = []) {
        games.forEach(g => {
            this.brain.library.push({
                appid: g.appid || null,
                playtime: g.playtime_forever,
                lastplay: g.rtime_last_played,
            })
        })
    }

    printContents() {
        console.log(this.brain)
    }
}