require('dotenv').config()
const { USERNAME, PASSWORD } = process.env
const views   = require('./views')
const pug     = require('pug')
const path    = require('path')
const express = require('express')
const app     = express()

app
.set('view engine', 'pug')
.use(express.static('static'))

if(USERNAME && PASSWORD){
  const auth  = require('http-auth')
  const basic = auth.basic({
    realm: 'Bend Financial Staging',
  }, (username, password, callback) => {
      callback(
        username === process.env.USERNAME &&
        password === process.env.PASSWORD
      )
  })
  app
  .use(auth.connect(basic))
}

const withDefaults = (opts) => {
  const header = pug.renderFile(path.join(__dirname, 'modules/header.pug'))
  const footer = pug.renderFile(path.join(__dirname, 'modules/footer.pug'))

  return Object.assign({
    title: 'View',
    path: 'path-to-view',
    notes: '',
    header,
    footer
  }, opts)
}

const makeIndex = (views) => {
  const data = views.reduce((data, {
    status,
    title,
    route,
    notes,
    docsLink,
    submodules,
    variations
  }) => {
    const temp = {}
    temp[status] = [
      ...data.statuses[status],
      {
        title,
        route,
        notes,
        docsLink,
        submodules,
        variations
      }
    ]

    return Object.assign(data, Object.assign(data.statuses, temp))
  }, {
    statuses: views.reduce((statuses, {status}) => {
      const temp = {}
      temp[status] = []
      return Object.assign({}, statuses, temp)
    }, {}),
    total: views.length
  })

  return pug.renderFile(path.join(__dirname, 'views/index.pug'), data)
}

const _rf = (f, opts) => pug.renderFile(path.join(__dirname, f), opts)

app.get('/', (req, res) => {
  const header = _rf('modules/header.pug')
  const footer = _rf('modules/footer.pug')

  res.render('base', {
    title: 'Views',
    inner: makeIndex(views),
    header,
    footer,
    css: ['index']
  })
})

app.get('/view/*', (req, res) => {
  const _route  = req.path.substring(6)
  const view    = Object.assign({}, views.find(({route}) => route === _route), req.query)
  let _view     = view

  if(!view){
    return res.status(404).render('404')
  } else {

    ['header', 'footer'].forEach((prop) => {
      if(view[prop]){
        _view[prop] = _rf(`modules/${view[prop]}.pug`, view)
      }
    })

    if(_view.submodules){
      _view.submodules = _view.submodules.map((submodule) => {
        const { route } = view
        return Object.assign({}, submodule, {
          submoduleInner: _rf(
            `modules/${submodule.hash}.pug`,
            Object.assign({}, submodule, req.query, { route })
          )
        })
      })
    }
    _view.inner = _rf(`views/${view.route}.pug`, view)
    res.status(200).render('base', withDefaults(_view))
  }
})

const PORT = process.env.PORT || 311
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`)
  if(USERNAME && PASSWORD){
    console.log(`Username: ${USERNAME}`)
    console.log(`Username: ${PASSWORD}`)
  } else {
    console.log('No authentication')
  }
})
