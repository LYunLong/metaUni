
const Koa = require('koa');

const WebSocket = require('koa-websocket');

const app = WebSocket(new Koa());

app.listen(3001)

/**
 * 开启服务
*/

let players = [];

const speed = 60

function frame (deltaTime) {

    let thisFrameDistance = speed * ( deltaTime / 1000 )

    players.forEach(item => {
        if (item.H) {
            if (item.H == -1) {  //左
                item.X = item.X - thisFrameDistance
            }else {
                item.X = item.X + thisFrameDistance
            }
        }
        if (item.V) {
            if (item.V == -1) {  //上
                item.Y = item.Y - thisFrameDistance
            }else {
                item.Y = item.Y + thisFrameDistance
            }
        }
    });
}

function frameForSecond() {
    players.forEach(item=> {
        // item.websocket.send('say-'+JSON.stringify({
        //     id: item.id,
        //     content: '我是定时说话'
        // }))
        players.forEach(item2=> {
            item2.websocket.send('player-'+JSON.stringify({
                id: item.id,
                H: item.H,
                V: item.V,
                X: item.X,
                Y: item.Y,
            }))
        })
    })
}

let noLimitPT = 0 //最小间隔循环的 上次刷新时间

let sixtyFrameLimitPT = 0 //60帧/s的常规刷新

let oneFrameLimitPT = 0  //1帧/s的长间隔刷新

function render() {

    let cur = new Date().getTime();

    if (noLimitPT) {
        let deltaTime = cur - noLimitPT
        frame(deltaTime)
    }
    
    noLimitPT = cur;  //每次循环更新最小间隔last渲染时间

    if (cur - 16 > sixtyFrameLimitPT) { //达到60帧单帧间隔
        //执行 
        sixtyFrameLimitPT = cur
    }

    if (cur - 1000 > oneFrameLimitPT) { //达到1帧/s单帧间隔
        //执行 
        frameForSecond()
        oneFrameLimitPT = cur
    }
    setTimeout(function(){ render(); })
}

render()

app.ws.use((ctx, next)=>{

    console.info(111111)

    players.push(ctx);

    ctx.init = function() {
        this.id = new Date().getTime() + 't' + players.length
        this.H = 0;
        this.V = 0;
        this.X = 0;
        this.Y = 0;

        this.websocket.send('self-'+ JSON.stringify({
            id: this.id,
            H: this.H,
            V: this.V,
            X: this.X,
            Y: this.Y,
        }))
        /**
         * 同步一次当前用户列表
        */

       /**
         * 广播用户列表告知新用户加入
        */
        for (let i = 0; i< players.length; i++) {
            this.websocket.send('player-'+JSON.stringify({
                id: players[i].id,
                H: players[i].H,
                V: players[i].V,
                X: players[i].X,
                Y: players[i].Y,
            }))
            players[i].websocket.send('player-'+JSON.stringify({
                id: this.id,
                H: this.H,
                V: this.V,
                X: this.X,
                Y: this.Y,
            }))
        }
    }

    ctx.init() //初始化链接对象的场景属性

    

    ctx.websocket.on('message', (message)=>{

        if (message.match(/^move\-/)) {
            let moveAction = JSON.parse(message.replace(/^move\-/,''))
            if (ctx.H == moveAction.H && ctx.V == moveAction.V) {
                return;
            }
            ctx.H = moveAction.H;
            ctx.V = moveAction.V;
            /**
             * 广播此次变化
            */
            for (let i = 0; i< players.length; i++) {
                players[i].websocket.send('player-'+JSON.stringify({
                    id: ctx.id,
                    H: ctx.H,
                    V: ctx.V,
                    X: ctx.X,
                    Y: ctx.Y,
                }))
            }
        }

        if (message.match(/^say\-/)) {
            let say = JSON.parse(message.replace(/^say\-/,''))
            for (let i = 0; i< players.length; i++) {
                players[i].websocket.send('say-'+JSON.stringify({
                    id: ctx.id,
                    content: say.content
                }))
            }
        }
        
    })

    ctx.websocket.on('close', (message)=>{
        console.info('closing:',ctx.id)
        let index = players.indexOf(ctx);
        players.forEach((item)=>{
            item.websocket.send('leave-'+ JSON.stringify({
                id: ctx.id
            }))
        })
        players.splice(index, 1);
    })

    // ctx.websocket.
})