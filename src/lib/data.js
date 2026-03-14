import { writable } from 'svelte/store'
import { steamAPICall } from '$lib/steam'

const app_title = "steam.0010"
const storage_ref = `localDB-${app_title}`

let default_filters = {
    "Display": "All",
    "Genre": "All",
    "Platform": "All",
    "Max_Playtime": "None",
    "Max_Price": "None",
    "Sort": "Relevance"
}

let initial_db = {
    user: {},
    filters: default_filters,
    sid: null
}

const storage = {
    read: function (location) {
        if (typeof window =="undefined")    return
        if (storage.exists(location))       return localStorage[location]
        else                                return ''
    },
    write: function (location, value) {
        if (typeof window =="undefined")    return
        localStorage[location] = value
    },
    clear: function() {
        if (typeof window =="undefined")    return
        localStorage.clear()
    },
    exists: function (location) {
		if (typeof window =="undefined")    return
        if (localStorage[location])         return true
		else                                return false
	}
}

export const db = storage.exists(storage_ref) ? writable(JSON.parse(storage.read(storage_ref))) : writable(initial_db)

export function clearDB() {
    db.update(data => {
        data = initial_db
        return data
    })
    console.log("Cleared db")
}

const user_id = "76561199687209554"
export function updateUserObject() {
    db.update(data => {
        steamAPICall("getPlayerSummary", user_id, ret => {
            data.user = ret.response.players[0]
        })
        return data
    })
}

db.subscribe(db => {
    let data
    
    if (Object.keys(db) == undefined) {
        data = initial_db
        alert("Database Fault Detected: Restart & Reload")
        if (typeof window !== "undefined") window.open("/", "_self")
    }
    else {
        data = JSON.stringify(db)
    }

    storage.write(storage_ref, data)
})