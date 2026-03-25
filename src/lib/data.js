// data.js
// by Aaron Meche

// This file exports a "db" constant
// that allows for easy and convenient
// local data storage on client browsers


import { writable } from 'svelte/store'
import { steamAPI } from '$lib/steam'

const app_title = "gamesage_0.0.3"
const storage_ref = `ldb-${app_title}`

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
    algr: {},
    cache: {},
    filters: default_filters,
}

const storage = {
    read: function (location) {
        if (typeof window =="undefined") return
        return localStorage[location] || null
    },
    write: function (location, value) {
        if (typeof window =="undefined") return
        localStorage[location] = value
    },
    clear: function() {
        if (typeof window =="undefined") return
        localStorage.clear()
    },
    exists: function (location) {
		if (typeof window =="undefined") return
        if (localStorage[location])      return true
		else                             return false
	}
}

export const db = storage.exists(storage_ref) ? writable(JSON.parse(storage.read(storage_ref))) : writable(initial_db)

export const clearDB = () => {
    db.update(data => {
        data = initial_db
        return data
    })
    console.log("Cleared db")
}

db.subscribe(db => {
    let data
    if (Object.keys(db) == undefined) {
        data = initial_db
        console.error("Database Fault")
        alert("Database Fault Detected: Restart & Reload")
    }
    else {
        data = JSON.stringify(db)
    }
    storage.write(storage_ref, data)
})