

const Koa = require('koa');

const WebSocket = require('koa-websocket');

const app = WebSocket(new Koa());

// app.use(async (ctx , next) => {
//     await next();
//     const rt = ctx.response.get('X-Response-Time');
//     console.log(`${ctx.method} ${ctx.url} - ${rt}`)
// })

// app.use(async (ctx, next) => {
//     const start = Date.now();
//     await next();
//     const ms = Date.now() - start;
//     ctx.set('X-Response-Time', `${ms}ms`);
// })

// app.use(async ctx => {
//     ctx.body = 'Hello World'
// })

app.listen(3001)

let players = [];

app.ws.use((ctx, next)=>{
    players.push(ctx);

    ctx.init = function(){
        this.id = new Date().getTime()
        this.posX = 0;
        this.posY = 0;
        this.H = 0;
        this.V = 0
    }

    ctx.init()

    ctx.websocket.on('message', (message)=>{

        if (message.match(/^move\-/)) {
            let avatarAction = JSON.parse(message.replace(/^move\-/,''))
            console.info(avatarAction.H)
            ctx.H = avatarAction.H;
            ctx.V = avatarAction.V;
        }

        
        for (let i=0; i<players.length; i++) {
            console.info(players[i].id)
            let playerStr = 'playerStatus-'+JSON.stringify({
                id : ctx.id,
                H: ctx.H,
                V: ctx.V
            })
            console.info(playerStr)
            players[i].websocket.send(playerStr);

            if (ctx === players[i]) {}else{}
        }
    })
    ctx.websocket.on('close', (message)=>{
        let index = players.indexOf(ctx);
        players.splice(index, 1);
    })
})
