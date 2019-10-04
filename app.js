const express           = require('express')
const logger            = require('morgan')
const body_parser       = require('body-parser')
const cors              = require('cors')
const http              = require('http')
const app               = express()
const server            = http.createServer(app)
const exws              = require('express-ws')(app, server)
const { MongoClient, ObjectID }   = require('mongodb')

var io = require('socket.io')(server);
io.origins('*:*');

let collection
let db

app.use(body_parser.json())
app.use(logger("dev"))
app.use(cors({credentials: false}))
app.options('*', cors({credentials: false}))

app.ws('/ws', (ws, req) => {

    ws.isAlive = true

    ws.on('message', (message) => {
        console.log(`received: ${message}`)
        ws.send(`Message: ${message}`)
    })

    ws.on('pong', () => {
        ws.isAlive = true
    })

    ws.send('web socket')

})

app.post('/lotes/', async (req, res) => {
    
    let element = req.body
    let inserted_id

    try {
        inserted_id     = await collection.insertOne(element)._id
    } catch {
        console.log('error on POST')
    }
    console.log('element', element)

    exws.getWss().clients.forEach(async (ws) => {
        console.log(element)
        element_to_send = {...element, '_id': inserted_id}
        ws.send(JSON.stringify(element))
    })

    res.send('Succesfully created element')

})

app.put('/lotes/:id/stages/:name/:variable/:value', async (req, res) => {

    collection.find({'_id': ObjectID(req.params.id)}).toArray(async (err, result) => {
        
        if (err) {

            console.log(err)
            res.status(400).send('not found')
        
        } else {
            
            db.collection('default').findOne({'color': result[0].color}, (err, res) => {
                
                let result_element = result
                
                let stage = result[0].stages.find((element) => element.name == req.params.name)
                let variable = stage.variables.find(element => element.name == req.params.variable)
                result_element[0].stages[result[0].stages.indexOf(stage)].variables[stage.variables.indexOf(variable)].value = req.params.value
                result_element[0].stages[result[0].stages.indexOf(stage)].variables[stage.variables.indexOf(variable)].error = -1 + (req.params.value)/(res.stages[result[0].stages.indexOf(stage)].variables[stage.variables.indexOf(variable)].value)
                
                let time = res.forecast
                let delay = 0
                for (const [ index, stage ] of result_element[0].stages.entries()) {
                    for (const [ idx, variable] of stage.variables.entries()) {
                        if (stage.completed) {
                            delay += (Math.abs(variable.error))*(time/(result_element[0].stages.length*stage.variables.length))
                        }
                    }
                }

                let new_time = time + delay 

                collection.updateOne({'_id': ObjectID(req.params.id)}, {$set: {'forecast': new_time}})
                collection.updateOne({'_id': ObjectID(req.params.id)}, {$set: result_element[0]})
                
                exws.getWss().clients.forEach(async (ws) => {
                    ws.send(JSON.stringify(result_element[0]))
                })
      
            })

            res.send('updated')
        
        }
    })

})

app.put('/lotes/:id/stages/:name/finished', async (req, res) => {

    collection.find({'_id': ObjectID(req.params.id)}).toArray(async (err, result) => {
        if (err) {
            console.log(err)
            res.status(400).send('not found')
        } else {
            db.collection('default').findOne({'color': result[0].color}, (err, color) => {

                result_element = result
                let stage = result[0].stages.find((element) => element.name == req.params.name)
                if (!result_element[0].stages[result[0].stages.indexOf(stage)].completed) {
                    result_element[0].stages[result[0].stages.indexOf(stage)].completed = true

                    let time = color.forecast
                    let delay = 0
                    for (const [ index, stage ] of result_element[0].stages.entries()) {
                        for (const [ idx, variable] of stage.variables.entries()) {
                            if (stage.completed) {
                                delay += (Math.abs(variable.error))*(time/(result_element[0].stages.length*stage.variables.length))
                            }
                        }
                    }
                
                    let new_time = time + delay 
                    result_element[0].forecast = new_time
                    result_element[0].progress += (1/result[0].stages.length)
                    collection.updateOne({'_id': ObjectID(req.params.id)}, {$set: result_element[0]})            
                    exws.getWss().clients.forEach(async (ws) => {
                        ws.send(JSON.stringify(result_element[0]))
                    })
                } 

                res.send('updated')
            })
        }
    })

})

app.post('/lotes/:id/change', async (req, res) => {

    collection.updateOne({'_id': ObjectID(req.params.id)}, {$set: req.body})            

    exws.getWss().clients.forEach(async (ws) => {
        ws.send(JSON.stringify(req.body))
    })
            
    res.send('updated')


})

app.put('/lotes/:id/unfinish', async (req, res) => {

    collection.find({'_id': ObjectID(req.params.id)}).toArray(async (err, result) => {
        if (err) {
            console.log(err)
            res.status(400).send('not found')
        } else {
            db.collection('default').findOne({'color': result[0].color}, (err, color) => {
                result_element = result
                let stage = result[0].stages.find((element) => element.name == req.params.name)
                for (const [ index, stage ] of result[0].stages.entries()) {
                    result_element[0].stages[index].completed = false
                }
                result_element[0].progress = 0
                result_element[0].forecast = color.forecast
                collection.updateOne({'_id': ObjectID(req.params.id)}, {$set: result_element[0]})            

                exws.getWss().clients.forEach(async (ws) => {
                    ws.send(JSON.stringify(result_element[0]))
                })

                res.send('updated')
            })
        }
    })

})

app.get('/lotes/', async (req, res) => {

    // const collection = req.app.locals.collection
    collection.find({}).toArray(async (err, result) => {
        if (err) {
            console.log(err)
            res.status(400).send('not possible')
        } else {
            res.send(JSON.stringify(result))
        }
    })
})

app.get('/lotes/:id', async (req, res) => {

    // const collection = req.app.locals.collection
    collection.find({'_id': ObjectID(req.params.id)}).toArray(async (err, result) => {
        if (err) {
            console.log(err)
            res.status(400).send('not possible')
        } else {
            res.send(JSON.stringify(result))
        }
    })
})

app.delete('/lotes/one/:id', async (req, res) => {

})

app.delete('/lotes/all', async (req, res) => {

    // const collection = req.app.locals.collection

    collection.deleteMany({}, async (err, result) => {
        if (err) {
            console.log(err)
            res.status(400).send('not possible')
        } else {
            
            exws.getWss().clients.forEach(async (ws) => {
                ws.send(JSON.stringify([]))
            })

            res.send(JSON.stringify(result))
        }
    })
})

app.post('/default/:color_id', async (req, res) => {
    
    let element = req.body
    let inserted_id

    try {
        await db.collection('default').insertOne(element)
    } catch {
        console.log('error on POST')
    }

    res.send('Succesfully created element')

})

app.get('/default/all', (req, res) => {
    
    db.collection('default').find({}).toArray(async (err, results) => {
        res.send(JSON.stringify(results))
    })
})

app.get('/default/one/:color', (req, res) => {

    db.collection('default').findOne({'color': req.params.color}, (err, result) => {
        res.send(JSON.stringify(result))
    })
})

setInterval(() => {
    exws.getWss().clients.forEach((ws) => {
        if (!ws.isAlive) return ws.terminate()
        ws.isAlive = false
        ws.ping(null, false, true)
    })
}, 5000)

MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true }).then(client => {
    db = client.db('factory')
    collection = db.collection('lotes')
    server.listen(3000, () => console.log('API running'))
}).catch(error => console.error(error))

process.on('SIGINT', () => {
    db.close()
    process.exit()
})