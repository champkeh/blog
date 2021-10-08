"use strict"

import axios from 'axios'
import lunr from 'lunr'

window.SearchApp = {
    searchField: document.getElementById('searchField'),
    allwords: document.getElementById('allwords'),
    output: document.getElementById('output'),
    searchData: {},
    searchIndex: {}
}

axios.get("/search/index.json").then(response => {
    SearchApp.searchData = response.data
    SearchApp.searchIndex = lunr(function () {
        this.pipeline.remove(lunr.stemmer)
        this.searchPipeline.remove(lunr.stemmer)
        this.ref('href')
        this.field('title')
        this.field('body')
        response.data.results.forEach(e => {
            this.add(e)
        })
    })
})

SearchApp.searchField.addEventListener('input', search)
SearchApp.allwords.addEventListener('change', search)

function search() {
    let searchText = SearchApp.searchField.value
    searchText = searchText.split(' ').filter(word => word !== '')

    if (SearchApp.allwords.checked) {
        searchText = searchText.map(word => '+' + word)
    }
    searchText = searchText.map(word => word + '*')
    searchText = searchText.join(' ')

    console.log(searchText)

    let resultList = SearchApp.searchIndex.search(searchText)

    let list = []
    let results = resultList.map(entry => {
        SearchApp.searchData.results.filter(d => {
            if (entry.ref === d.href) {
                list.push(d)
            }
        })
    })

    display(list)
}

function display(list) {
    SearchApp.output.innerText = ''

    if (list.length > 0) {
        const ul = document.createElement('ul')
        list.forEach(el => {
            const li = document.createElement('li')
            const a = document.createElement('a')
            a.href = el.href
            a.text = el.title
            li.appendChild(a)
            ul.appendChild(li)
        })
        SearchApp.output.appendChild(ul)
    } else {
        SearchApp.output.innerText = 'Nothing found'
    }
}
