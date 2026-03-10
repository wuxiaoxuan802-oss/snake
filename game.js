/**
 * 貪吃蛇遊戲核心邏輯
 * 
 * 此程式碼採用 Canvas API 進行全手繪，並使用自定義的 Game Loop 處理邏輯。
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const overlay = document.getElementById('gameOverOverlay');
const finalScoreElement = document.getElementById('finalScore');

// 水果清單 (Emoji)
const FRUITS = ['🍎', '🍌', '🍇', '🍓', '🍒', '🍍', '🍑', '🥝', '🍋', '🍉'];

// 遊戲常數
const GRID_SIZE = 20; // 每個格子的大小
const TILE_COUNT = canvas.width / GRID_SIZE; // 在 400x400 下為 20x20 個格子

// 遊戲變數
let snake = [];
let food = { x: 5, y: 5 };
let dx = 0; // x 軸移動速度 (單位：格)
let dy = 0; // y 軸移動速度 (單位：格)
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameActive = false;
let lastUpdateTime = 0;
let speed = 7; // 每秒移動幾次 (越高越快)

highScoreElement.textContent = highScore;

let isMoving = false; // 紀錄蛇是否已經開始移動
let snakeColor = '#00ff88'; // 預設顏色
let snakeColorSecondary = '#00bcd4';

/**
 * 初始化或重置遊戲狀態
 */
function resetGame() {
    // 隨機生成每局的蛇顏色 (使用 HSL 確保色彩鮮豔)
    const hue = Math.floor(Math.random() * 360);
    snakeColor = `hsl(${hue}, 100%, 50%)`;
    snakeColorSecondary = `hsl(${(hue + 40) % 360}, 100%, 45%)`;

    snake = [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 }
    ];
    dx = 0;
    dy = 0; // 預設不移動，等待按鍵
    isMoving = false;
    score = 0;
    scoreElement.textContent = score;
    overlay.style.display = 'none';
    gameActive = true;
    generateFood();

    // 開始遊戲循環
    requestAnimationFrame(gameLoop);
}

/**
 * 隨機生成食物，確保不會生成在蛇身上
 */
function generateFood() {
    let newX, newY;
    let onSnake = true;

    while (onSnake) {
        newX = Math.floor(Math.random() * TILE_COUNT);
        newY = Math.floor(Math.random() * TILE_COUNT);

        // 檢查是否與蛇身重疊
        onSnake = snake.some(part => part.x === newX && part.y === newY);
    }

    food = {
        x: newX,
        y: newY,
        type: FRUITS[Math.floor(Math.random() * FRUITS.length)] // 隨機挑選一個水果
    };
}

/**
 * 遊戲主迴圈
 */
function gameLoop(timestamp) {
    if (!gameActive) return;

    // 控制更新頻率 (FPS 控制)
    const secondsSinceLastRender = (timestamp - lastUpdateTime) / 1000;
    if (secondsSinceLastRender < 1 / speed) {
        requestAnimationFrame(gameLoop);
        return;
    }
    lastUpdateTime = timestamp;

    update();
    draw();

    if (gameActive) {
        requestAnimationFrame(gameLoop);
    }
}

/**
 * 更新遊戲邏輯：移動蛇、碰撞偵測
 */
function update() {
    // 如果還沒開始移動，則跳過邏輯更新
    if (!isMoving) return;

    // 計算新的頭部位置
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // 1. 碰撞偵測 - 牆壁
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        gameOver();
        return;
    }

    // 2. 碰撞偵測 - 撞到自己
    if (snake.some(part => part.x === head.x && part.y === head.y)) {
        gameOver();
        return;
    }

    // 將新頭部加入蛇身
    snake.unshift(head);

    // 3. 碰撞偵測 - 吃到食物
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        generateFood();
        // 不移除尾巴，蛇就會變長

        // 每吃五個增加一點速度
        if (score % 50 === 0) speed += 0.5;
    } else {
        // 沒吃到食物，移除尾巴
        snake.pop();
    }
}

/**
 * 繪製畫面
 */
function draw() {
    // 清空畫布 (稍微深色一點的背景)
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 繪製格線 (裝飾性，強化為更明顯的 0.1 透明度)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < TILE_COUNT; i++) {
        ctx.beginPath(); ctx.moveTo(i * GRID_SIZE, 0); ctx.lineTo(i * GRID_SIZE, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * GRID_SIZE); ctx.lineTo(canvas.width, i * GRID_SIZE); ctx.stroke();
    }

    // 繪製食物 (水果 Emoji)
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.2)'; // 水果發光改為輕微白光

    ctx.font = `${GRID_SIZE - 4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 在格子中心繪製 Emoji
    ctx.fillText(
        food.type,
        food.x * GRID_SIZE + GRID_SIZE / 2,
        food.y * GRID_SIZE + GRID_SIZE / 2 + 2 // 微調垂直位置
    );

    // 繪製蛇
    snake.forEach((part, index) => {
        const isHead = index === 0;

        // 根據位置計算顏色漸層
        ctx.shadowBlur = isHead ? 20 : 10;
        ctx.shadowColor = isHead ? snakeColor : snakeColorSecondary;
        ctx.fillStyle = isHead ? snakeColor : snakeColorSecondary;

        // 繪製圓角矩形蛇身
        const padding = isHead ? 0 : 1.5; // 頭部稍微大一點
        drawRoundedRect(
            part.x * GRID_SIZE + padding,
            part.y * GRID_SIZE + padding,
            GRID_SIZE - padding * 2,
            GRID_SIZE - padding * 2,
            isHead ? 8 : 4
        );

        // 繪製蛇的眼睛 (僅在頭部)
        if (isHead) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';

            // 根據移動方向調整眼睛位置 (預設向上)
            let eyeX1 = 5, eyeY1 = 5, eyeX2 = 15, eyeY2 = 5;

            if (dx === 1) { // 向右
                eyeX1 = 15; eyeY1 = 5; eyeX2 = 15; eyeY2 = 15;
            } else if (dx === -1) { // 向左
                eyeX1 = 5; eyeY1 = 5; eyeX2 = 5; eyeY2 = 15;
            } else if (dy === 1) { // 向下
                eyeX1 = 5; eyeY1 = 15; eyeX2 = 15; eyeY2 = 15;
            } else if (dy === -1 || (dx === 0 && dy === 0)) { // 向上或靜止
                eyeX1 = 5; eyeY1 = 5; eyeX2 = 15; eyeY2 = 5;
            }

            // 繪製兩隻小眼睛
            ctx.beginPath();
            ctx.arc(part.x * GRID_SIZE + eyeX1, part.y * GRID_SIZE + eyeY1, 2, 0, Math.PI * 2);
            ctx.arc(part.x * GRID_SIZE + eyeX2, part.y * GRID_SIZE + eyeY2, 2, 0, Math.PI * 2);
            ctx.fill();

            // 繪製瞳孔
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(part.x * GRID_SIZE + eyeX1, part.y * GRID_SIZE + eyeY1, 1, 0, Math.PI * 2);
            ctx.arc(part.x * GRID_SIZE + eyeX2, part.y * GRID_SIZE + eyeY2, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // 繪製「按鍵開始」提示
    if (!isMoving) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 20px ' + getComputedStyle(document.body).fontFamily;
        ctx.textAlign = 'center';
        ctx.fillText('按方向鍵開始遊戲', canvas.width / 2, canvas.height / 2 - 40);
    }

    // 重置 Shadow 以免影響其他繪製
    ctx.shadowBlur = 0;
}

/**
 * 輔助函式：繪製圓角矩形
 */
function drawRoundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

// 冷笑話庫 (擷取自 manmandays.com/joke/)
const JOKES = [
    "為什麼蛇不穿衣服？因為牠會「脫皮」。",
    "什麼樣的馬最容易累？「草泥馬」。",
    "有一天小明惹小美生氣，小美:「你再說一次！」小明:「一次」。",
    "為什麼企鵝只有肚子是白的？因為牠手短，洗澡洗不到背面。",
    "小蛇問爸爸：我們有毒嗎？爸爸：你問這幹嘛？小蛇：我不小心咬到舌頭了。",
    "為什麼北極熊不吃企鵝？因為北極熊在北極，企鵝在南極。",
    "哪一種龍最喜歡休息？「保龍」。(保養)",
    "什麼鳥最會遲到？「遲鳥」。",
    "為什麼蚊子喜歡叮小明？因為小明「沒名」。",
    "哪一種人最怕熱？「那個人」。",
    "白氣球揍了黑氣球一拳，黑氣球很痛很生氣於是決定告白氣球。",
    "買早餐時後面的人拍我肩說：「我先到欸！」我回他：「喔我流川楓」。",
    "小明去慢跑，跑著跑著襪子就破了，他很生氣的說：吼真的是jogging弄破襪欸！",
    "小明走著進超商，坐著輪椅出來，因為他繳費了。",
    "皮卡丘被揍之後會變成什麼？卡丘，因為他就不敢再皮了。",
    "皮卡丘站起來變成什麼？皮卡兵。",
    "那皮卡丘左右跳呢？皮卡乓乒乓乒乓。",
    "小明樹下野餐要走時衣服被勾住了，他跟朋友說：樹勾衣餒。",
    "幾點不能講笑話？一點，一點都不好笑。",
    "有一天芥末走在路上被路人打了一巴掌。路人：「阿你不是很嗆？」",
    "馬雅人有哪四種笑聲？瑪雅he、瑪雅呼、瑪雅哈、瑪雅哈哈…",
    "愚公臨死前：移山…移山………，兒子回答：亮晶晶？",
    "張飛不滿意自己寫的字對關羽說：我字好醜。關羽：呃，好醜你好，我字雲長。",
    "為什麼兩隻螞蟻在沙灘上行進沒有足跡？因為牠們騎腳踏車。",
    "唐三藏撿了一顆石頭畫了笑臉對孫悟空說：你媽笑了。",
    "最舒服的椅子是？Enjoy (音近：燕巢)。",
    "哪一個按摩椅品牌最脆弱？Tokuyo，偷哭唷。",
    "什麼題目最時尚？非選題（Fashion題）。",
    "泰國人減肥都喝什麼？沙瓦，因為沙瓦低卡～",
    "葡萄點名，猜一個水果？葡萄柚 (又)。",
    "姊姊要生了！弟弟能獲得什麼？成舅 (成就) 感。",
    "落枕要搭什麼車去醫院？接駁 (接脖) 車。",
    "超人保護地球，那誰保護城市？螢幕，螢幕保護程式 (城市)。",
    "蛤蜊放很久會變什麼？白酒 (久) 蛤蜊。",
    "手機的媽媽是誰？手機螢幕 (銀母)。",
    "為什麼漏雨的海產店不賣蛤蜊？因為「雨室蛤絕」。",
    "請問一顆星星有多重？八克，因為星巴克。",
    "誰最會烤肉？老師，因為考 (烤) 的都沒有教 (焦)。",
    "為什麼模範生容易被綁架？因為他一副好綁 (榜) 樣。",
    "肚子餓打什麼針？田馥甄 (填腹針)。",
    "李白怎麼死的？失血 (詩寫) 過多。",
    "卓別林死後會變成什麼？草莓，因為死卓別林 (strawberry)。",
    "地瓜是哪國人？韓國，因為他是韓籍 (台語音近地瓜)。",
    "你知道冰塊最想做甚麼事嗎？退伍，因為他當冰 (兵) 很久了。",
    "佛陀如果開店叫什麼？佛陀shop。",
    "哪一個藝人專門在發行照給人？江蕙，因為「哇ㄟ齁哩 (給你) 行照」。",
    "誰的大便是圓的？圓 (原) 屎人。",
    "什麼水果最燙？梨子，醫院離子 (梨子) 燙。",
    "老王、老張、老陳開車闖紅燈，誰會被開單？老王，因為罰 (法) 老王。",
    "玻璃要跳樓前的最後一句話是什麼？晚安～因為他要碎 (睡) 了。",
    "怎麼讓麻雀安靜下來？壓牠，因為壓雀 (鴉雀) 無聲。",
    "皇帝最怕得什麼病？痔瘡，因為朕忌消痔 (正氣消脂) 丸。",
    "牛牽到北極會變成什麼？New Balance，牛被冷死 (音近)。",
    "有沒有感覺變胖了？小美回答：呢。(妳說呢)",
    "吉野櫻跟八重櫻差在哪？土裡。",
    "貝殼回家了，他說：I am back (貝殼)。",
    "警衛在笑什麼? 警衛在校 (笑) 門口。",
    "饒舌歌手買不到葡萄：因為他們都說我要葡萄yo～。",
    "去年夏天我去夏威夷，結果威夷就嚇 (夏) 到了。",
    "老人照鏡子看到什麼？老樣子。",
    "哪種交通工具最容易被嘴？火車，因為他欠嗆 (遷強) 欠嗆。",
    "如何把飲料變大？唸大悲 (大杯) 咒。",
    "Y問U為什麼哭？Y：Uniqlo (U你哭囉)。",
    "氧氣和二氧化碳誰較美？氧氣，因為氧氣會助燃 (自然) 就是美。",
    "哈利波特誰最有主見？佛地魔，因為他不會被牽著鼻子走。",
    "為什麼濁水溪跟曾文溪不能在一起？因為他們不適合 (不似河)。",
    "鴨子喉嚨痛會變成什麼？南瓜 (難呱)。",
    "警察生氣變什麼？警報 (暴) 器。",
    "草跟蛋誰比較高？【蛋比較高，因為草莓蛋糕】",
    "為什麼螃蟹明明沒有感冒卻一直咳嗽？【因為牠是甲殼(假咳)類動物】",
    "為什麼暖暖包到現在還一堆人在用？【因為他有鐵粉】",
    "達文西密碼上面是什麼？【達文西帳號】",
    "達文西密碼下面是什麼？【忘記密碼】",
    "壞事一定要在中午做，為什麼？【因為～早晚會有報應】",
    "為什麼蠶寶寶很有錢？【因為牠會節儉（結繭）】",
    "什麼帽子流行又性感？【流行性感冒（帽）】",
    "易經他媽媽是誰？【液晶螢幕】",
    "禿頭的人適合看鬼片：【因為會讓他們頭皮發毛】",
    "鎖匠跟大學生誰學歷比較高？【鎖匠，因為他有研究鎖。】",
    "我出門前對桌上的隱形眼鏡說：我根本沒把妳放在眼裡！",
    "問世間情為何物？【八點檔】",
    "我講一個笑裡藏刀的笑話：【哈哈哈哈哈哈哈哈刀哈哈哈哈哈哈哈哈】",
    "鹿茸是什麼？【鹿耳朵裡長的毛】",
    "現在的便當一個根本吃不飽：【你有吃兩個嗎】",
    "A-Z哪一個最愛裝酷？【C裝酷】",
    "吃飯吃不夠添飯要找誰？【飛龍，飛龍在天】",
    "什麼國家不用發電？【緬甸】",
    "麒麟飛到北極會怎樣？【變冰淇凌】",
    "什麼飲料最愛遲到？【珍珠奶茶，因為珍珠要等喔！】",
    "為什麼農夫要喝全糖？【因為農夫種田】",
    "為什麼鄉下人都不趕去河裡游泳？【因為「鄉間河太急」】",
    "優格開封後可以保存幾天？【七天。因為開封優格保七天】",
    "有一隻老鼠掛了他會去哪裡？【澳洲，因為澳洲 die 鼠】",
    "T懷孕會變成什麼？【ㄛ】",
    "T變性會變成什麼？【丁】",
    "丁丁勃起會變什麼？【ㄎㄎ】",
    "I坐下會變什麼？【ㄣ】",
    "你知道薄荷糖跟十字架的共同點是什麼嗎？【他們都能提神】",
    "你知道要怎麼判斷一個人是否成年嗎？【看神父對他們有沒有興趣】",
    "你知道同性戀的黑人是什麼嗎？【MM巧克力】",
    "你知道為什麼綿羊剃毛就睡不著？【因為他失眠了】",
    "你知道NIKE跟鞭子有什麼共同點嗎？【都可以讓黑人跑得更快】",
    "如果貝多芬復活，你知道他會怎麼評價現在的音樂嗎？【他聽不見】",
    "你知道為什麼美國人不能玩傳說對決嗎？【因為他們開局就少兩個塔】",
    "雙手節肢的人最想收到什麼禮物？【新手大禮包】",
    "怎麼分辨大小S？【死者為大】",
    "人死後是骨灰，霍金死後是冰沙【因為霍金有漸凍症】",
    "你知道十字架還能叫什麼嗎？【釘書機（釘穌機）】",
    "黑人的什麼最白？【他們的主人】",
    "知道為什麼那麼多人想當兵馬俑嗎？【因為守贏政的很爽】",
    "阿嬤跟洗髮乳有什麼共同點？【都會倒在浴室地板上】",
    "為何得癌症的人特別健談？【因為他們都有化療（話聊）】",
    "為什麼非洲的人生病都好不了？【因為飯後才能吃藥】",
    "你知道唐氏症為什麼不能玩跳跳床嗎？【會變跳跳糖】",
    "最甜的國家是什麼？【非洲，因為很多巧克力】",
    "一個黑人跟一個墨西哥人在車裡，誰在開車？【警察】",
    "柯比此生最後得了什麼獎？【螺旋槳】",
    "為什麼孤兒無法玩捉迷藏？【因為沒有人會去找他們】",
    "什麼人去看醫生的時候會覺得自己比醫生還要厲害？【窮人，因為窮人看不起醫生】",
    "耶穌為什麼不能打籃球？【因為他被盯的很緊】",
    "殘障人士生的小孩要怎麼稱呼？【殘（蠶）寶寶】",
    "跌倒谷底的時候要去哪裡？【養老院，因為有很多翻身的機會】",
    "唐氏症的人雞雞勃起時叫什麼？【唐揚雞】",
    "為什麼去八仙樂園的人都很會穿衣服？【因為他們超會搭（臭灰搭）】",
    "希特勒最喜歡玩什麼？【捉猶】",
    "為什麼大人都會教小朋友手濕濕的不能碰插座？【因為怕他們早熟】",
    "怎麼稱稱皮膚很黑的人？【你不膚淺】",
    "有100個垃圾去爬山結果遇難後死了96個，剩下4個誰要去救？【你，因為你救4個垃圾】",
    "有些朋友就像星星，你不一定每天都看到他們，但你知道他們會在那裡…而且一點用也沒有",
    "兩個白痴在一起會一起死。【87+87=174】",
    "最近高燒不退三天了，吃藥也不會好，後來我發現原來是因為我是暖男",
    "皮卡丘不洗澡會變什麼？【Pokémon垢】",
    "一間餐廳誰最厲害？【顧客，因為他們有點東西】",
    "避孕藥的成分是什麼？【抗生素】",
    "什麼題目最時尚？【非選題（fashion題）】",
    "誰吃麵最快？【瘋狂假面】"
];

// 土味情話庫 (擷取自 womenshealthmag.com)
const PICKUP_LINES = [
    "我就說怎麼手上突然多了雙筷子，原來是看到我的菜了。",
    "今天吃了泡麵、吃了炒麵，還是想走進你的心裡面。",
    "別人吃漢堡是想飽，我吃漢堡是想「抱」你。",
    "今天吃了一個桃，你猜什麼桃？愛你在劫難逃。",
    "馬鈴薯可以變成馬鈴薯泥，玉米可以變成玉米泥，我可以變成我愛泥。",
    "這是筷子，這是筷架。筷子給你，快嫁給我。",
    "你知道最大的辣是什麼辣嗎？是我想你辣。",
    "你是咖啡做的嗎？不然怎麼每次看到你都來了精神。",
    "我一定是鹽吃多了，不然怎麼天天閒的想你呢。",
    "你喝過最好喝的酒是什麼？我和你的天長地久。",
    "多穿點衣服，別讓我的全世界冷到了。",
    "最近總睡不好，醫生建議我睡你懷裡。",
    "有了白髮別拔，因為我想與你白頭偕老。",
    "我給你買了個鐘，對你的情有獨鍾。",
    "我給你買了指南針，因為我怕把你寵到找不著北~",
    "昨晚沒睡好，因為被子太輕，壓不住我想你的心。",
    "自從認識你之後我就常常感冒，因為對你沒有抵抗力。",
    "現在是幾點？是我們幸福的起點。",
    "我很想曬黑，這樣才能暗中保護你。",
    "你是不是把藍牙打開了，我們好像配對上了。",
    "我想換一個髮型，沒有你不行。",
    "這支口紅送妳，但是妳要記得每天還我一點哦！",
    "你知道你跟星星有什麼差別嗎？星星在天上，你在我心上。",
    "沒有水的地方是沙漠，沒有你的地方是寂寞。",
    "我想你的時候，世界會落下一粒沙，從此有了撒哈拉。",
    "今天去了一個島，你猜是什麼島？被你迷得神魂顛倒。",
    "我就說元素週期表怎麼少了三個元素，原來鎂鋁在這裡，我的鋅也在這裡。",
    "幻想過自己是美術生，體育生，最後才發現沒有你，我痛不欲生。",
    "你是圓規的針，我是圓規的筆，我繞著你，畫出圓滿。",
    "如果你是拿破崙，那我就是滑鐵盧，讓你栽在我的心上。",
    "我是九你是三，除了你還是你。",
    "你是負2、我是負5，我們加在一起就是負7（夫妻）。",
    "剪刀石頭布我只出剪刀，因為你是我的拳布。",
    "我們玩一二三木頭人...我輸了，因為美到心動了。",
    "我最近在學英文，最喜歡一個單詞叫 emo，我e直在背後momo的想你。",
    "你不理我的時候，我就像一個去皮的蕃薯...因為去P了就是oTATo。",
    "愛你，我不知所措。",
    "你知道我看女生第一眼都是看哪嗎？看你。",
    "你撥動了我的心弦。",
    "我最近想買一套房...你的左心房。",
    "我以後應該稱呼你為您，因為你在我心上了。",
    "我這人沒什麼好的，只有好喜歡妳。",
    "我感覺你壓到我心臟了，因為我已經把你當成我的心上人了。",
    "我覺得我有毒，你知道是什麼毒嗎？沒有你的夜夜孤獨。",
    "有人說女人是水做的，那妳知道我是什麼做的嗎？為妳量身訂做。",
    "想說些漂亮的話哄妳，但想來想去，最漂亮的只有妳。",
    "妳有個缺點，缺點我。",
    "你特別討厭，討人喜歡且百看不厭。",
    "我喜歡你的眼睛，因為你滿眼都是我。",
    "給我一顆打火機，因為我要點燃你的心。",
    "有一條路叫做「啊伊喜爹路」。",
    "情話都是留言區抄來的，但喜歡你是真的。"
];

// 情話裝飾 Emoji
const HEART_EMOJIS = ['❤️', '😍', '💕', '😘', '😉', '🥰', '😚', '😏', '🥺', '😽', '😻', '🫰', '💓', '🔥', '💞', '🫶'];

let lastMessageType = 'joke'; // 紀錄上次顯示的類型 ('joke' 或 'pickup')

/**
 * 遊戲結束處理
 */
function gameOver() {
    gameActive = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
    finalScoreElement.textContent = score;

    // 冷笑話與土味情話交叉生成邏輯
    let randomMessage = "";

    // 只有得分達到 100 分以上才顯示冷笑話或土味情話
    if (score >= 100) {
        if (lastMessageType === 'joke') {
            // 這次顯示土味情話
            const pickup = PICKUP_LINES[Math.floor(Math.random() * PICKUP_LINES.length)];
            const emoji = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)];
            randomMessage = pickup + " " + emoji;
            lastMessageType = 'pickup';
        } else {
            // 這次顯示冷笑話
            randomMessage = JOKES[Math.floor(Math.random() * JOKES.length)];
            lastMessageType = 'joke';
        }
    } else {
        // 分數未達 100 分，顯示鼓勵訊息或保持空白
        randomMessage = "";
    }

    document.getElementById('jokeDisplay').textContent = randomMessage;
    overlay.style.display = 'flex';
}

/**
 * 輸入處理
 */
window.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();

    // 防止反向回頭 (例如：向上時不能直接按向下)
    if ((key === 'arrowup' || key === 'w') && dy !== 1) {
        dx = 0; dy = -1; isMoving = true;
    } else if ((key === 'arrowdown' || key === 's') && dy !== -1) {
        dx = 0; dy = 1; isMoving = true;
    } else if ((key === 'arrowleft' || key === 'a') && dx !== 1) {
        dx = -1; dy = 0; isMoving = true;
    } else if ((key === 'arrowright' || key === 'd') && dx !== -1) {
        dx = 1; dy = 0; isMoving = true;
    }
});

/**
 * 虛擬搖桿觸碰控制邏輯
 */
const joystickBase = document.getElementById('joystick-base');
const joystickKnob = document.getElementById('joystick-knob');

if (joystickBase && joystickKnob) {
    let joystickActive = false;
    let centerX, centerY;
    const maxRadius = 40; // 搖桿移動的最大半徑

    // 取得底座中心點位置
    function updateCenter() {
        const rect = joystickBase.getBoundingClientRect();
        centerX = rect.left + rect.width / 2;
        centerY = rect.top + rect.height / 2;
    }

    // 處理移動邏輯
    function handleJoystickMove(touchX, touchY) {
        if (!gameActive) return;

        const deltaX = touchX - centerX;
        const deltaY = touchY - centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // 限制搖桿頭移動範圍
        const angle = Math.atan2(deltaY, deltaX);
        const limitedDistance = Math.min(distance, maxRadius);

        const moveX = Math.cos(angle) * limitedDistance;
        const moveY = Math.sin(angle) * limitedDistance;

        joystickKnob.style.transform = `translate(${moveX}px, ${moveY}px)`;

        // 判斷方向 (至少移動一定距離才觸發)
        if (distance > 15) {
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);

            if (absX > absY) {
                // 水平移動
                if (deltaX > 0 && dx !== -1) { // 向右
                    dx = 1; dy = 0; isMoving = true;
                } else if (deltaX < 0 && dx !== 1) { // 向左
                    dx = -1; dy = 0; isMoving = true;
                }
            } else {
                // 垂直移動
                if (deltaY > 0 && dy !== -1) { // 向下
                    dx = 0; dy = 1; isMoving = true;
                } else if (deltaY < 0 && dy !== 1) { // 向上
                    dx = 0; dy = -1; isMoving = true;
                }
            }
        }
    }

    // 搖桿歸位函式
    function resetKnob() {
        joystickActive = false;
        joystickKnob.style.transform = 'translate(0, 0)';
    }

    joystickBase.addEventListener('touchstart', e => {
        e.preventDefault(); // 防止觸發頁面滾動
        joystickActive = true;
        updateCenter();
        handleJoystickMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    window.addEventListener('touchmove', e => {
        if (joystickActive) {
            e.preventDefault(); // 在搖桿操作中防止頁面滾動
            handleJoystickMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: false });

    window.addEventListener('touchend', resetKnob);
    window.addEventListener('touchcancel', resetKnob); // 處理觸碰取消的邊界情況

    // 視窗大小改變時更新中心點
    window.addEventListener('resize', updateCenter);
}


// 啟動遊戲
resetGame();
