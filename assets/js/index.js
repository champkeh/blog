"use strict"

import axios from 'axios'
import lunr from 'lunr'
import '@fortawesome/fontawesome-free/css/all.min.css'
import '@fortawesome/fontawesome-free/js/all.min'

window.SearchApp = {
    searchField: document.getElementById('search'),
    output: document.getElementById('output'),
    searchData: {},
    searchIndex: {}
}

document.addEventListener('keydown', evt => {
    if (document.activeElement !== window.SearchApp.searchField) {
        // 搜索框没有获取焦点
        if (evt.key === '/') {
            window.SearchApp.searchField.focus()
            evt.preventDefault()
        }
    } else {
        if (evt.key === 'Escape') {
            window.SearchApp.searchField.blur()
        }
    }
})


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

function search() {
    let searchText = SearchApp.searchField.value

    if (!searchText) {
        window.SearchApp.output.parentElement.classList.add('hide')
        return
    }

    searchText = searchText.split(' ').filter(word => word !== '')
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
    window.SearchApp.output.parentElement.classList.remove('hide')
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
