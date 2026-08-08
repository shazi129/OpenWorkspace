;(function() {
  var canvas = document.getElementById('mainCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  // ---------- 尺寸 ----------
  var W, H, groundH;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    groundH = H * 0.15;
  }
  resize();
  window.addEventListener('resize', resize);

  // ---------- 图片加载 ----------
  var sprites = new Image();
  sprites.src = 'flappy-bird.png';

  // ---------- 游戏状态 ----------
  var STATE = { IDLE: 0, PLAYING: 1, OVER: 2 };
  var state = STATE.IDLE;
  var score = 0;

  // ---------- 小鸟 ----------
  // 小鸟三帧在 sprite 中的位置（左上角坐标，每帧 34x24）
  // 这三帧 y 坐标不同，表示小鸟翅膀的不同位置
  var BIRD_FRAMES = [
    { sx: 230, sy: 762 },
    { sx: 230, sy: 814 },
    { sx: 230, sy: 866 },
  ];
  var BIRD_SW = 34, BIRD_SH = 24;

  var bird = {
    x: 0, y: 0, w: 0, h: 0,
    vy: 0, gravity: 0, jumpV: 0,
    frame: 0, frameTimer: 0,
    reset: function() {
      this.x = W * 0.2;
      this.y = H * 0.35;
      this.w = BIRD_SW;
      this.h = BIRD_SH;
      this.vy = 0;
      this.gravity = H * 0.001;
      this.jumpV = H * -0.012;
      this.frame = 0;
      this.frameTimer = 0;
    },
    update: function() {
      this.vy += this.gravity;
      this.y += this.vy;
      this.frameTimer++;
      if (this.frameTimer > 8) { this.frameTimer = 0; this.frame = (this.frame + 1) % 3; }
    },
    draw: function() {
      var angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, this.vy * 0.06));
      var frame = BIRD_FRAMES[this.frame];
      ctx.save();
      ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
      ctx.rotate(angle);
      ctx.drawImage(sprites, frame.sx, frame.sy, BIRD_SW, BIRD_SH, -this.w / 2, -this.h / 2, this.w, this.h);
      ctx.restore();
    },
    hitGround: function() {
      return this.y + this.h >= H - groundH;
    }
  };

  // ---------- 水管 ----------
  var pipeW = 0, pipeSpeed = 0, pipeGap = 0;

  // 水管的 sprite 区域：上方水管头 (112,646,52,320)，下方水管头 (168,646,52,320)
  var PIPE_HEAD_SW = 52, PIPE_HEAD_SH = 320;
  var PIPE_TOP_HEAD = { sx: 112, sy: 646 };
  var PIPE_BOT_HEAD = { sx: 168, sy: 646 };

  function createPipe(x) {
    var minTop = H * 0.08;
    var maxTop = H - groundH - minTop - pipeGap;
    var top = minTop + Math.random() * (maxTop - minTop);
    return { x: x, top: top, scored: false };
  }

  var pipes = [];

  function resetPipes() {
    pipeW = W * 0.12;
    pipeSpeed = W * 0.004;
    pipeGap = H * 0.25;
    pipes = [createPipe(W * 1.5), createPipe(W * 2.2)];
  }

  function rectCollide(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function hitPipe(pipe) {
    var px = pipe.x, pw = pipeW;
    var phTop = pipe.top, phBottom = H - groundH - pipe.top - pipeGap;
    return rectCollide(bird.x, bird.y, bird.w, bird.h, px, 0, pw, phTop) ||
           rectCollide(bird.x, bird.y, bird.w, bird.h, px, pipe.top + pipeGap, pw, phBottom);
  }

  // ---------- 地面 ----------
  var groundOffset = 0;
  var GROUND_SX = 585, GROUND_SY = 0, GROUND_SW = 336, GROUND_SH = 112;

  // ---------- 渲染 ----------
  function drawGround() {
    var tileW = W * 0.5;
    var tileH = groundH;
    for (var i = -1; i < Math.ceil(W / tileW) + 1; i++) {
      ctx.drawImage(sprites, GROUND_SX, GROUND_SY, GROUND_SW, GROUND_SH,
        i * tileW - (groundOffset % tileW), H - groundH, tileW, tileH);
    }
  }

  function drawPipe(pipe) {
    // 上方水管：顶部水管头 + 向下延伸的身体
    var headH = PIPE_HEAD_SH / PIPE_HEAD_SW * pipeW;
    ctx.drawImage(sprites, PIPE_TOP_HEAD.sx, PIPE_TOP_HEAD.sy, PIPE_HEAD_SW, PIPE_HEAD_SH,
      pipe.x, pipe.top - headH, pipeW, headH);
    // 身体部分：重复水管头的最后几行像素来拉伸
    if (pipe.top - headH > 0) {
      ctx.drawImage(sprites, PIPE_TOP_HEAD.sx, PIPE_TOP_HEAD.sy + PIPE_HEAD_SH - 2, PIPE_HEAD_SW, 2,
        pipe.x, 0, pipeW, pipe.top - headH);
    }

    // 下方水管
    var bottomY = pipe.top + pipeGap;
    var bottomH = H - groundH - bottomY;
    ctx.drawImage(sprites, PIPE_BOT_HEAD.sx, PIPE_BOT_HEAD.sy, PIPE_HEAD_SW, PIPE_HEAD_SH,
      pipe.x, bottomY, pipeW, headH);
    if (bottomH - headH > 0) {
      ctx.drawImage(sprites, PIPE_BOT_HEAD.sx, PIPE_BOT_HEAD.sy + 2, PIPE_HEAD_SW, 2,
        pipe.x, bottomY + headH, pipeW, bottomH - headH);
    }
  }

  function drawScore() {
    // 大号数字在 sprite 中的区域
    // "0" 在 (992,120)，"1-9" 从 (272,910) 开始，每个 24x36
    var digits = score.toString().split('');
    var dw = W * 0.04, dh = W * 0.06;
    var totalW = digits.length * dw;
    var startX = W / 2 - totalW / 2;
    var y = H * 0.1;
    digits.forEach(function(d, i) {
      var n = parseInt(d);
      var sx, sy;
      if (n === 0) { sx = 992; sy = 120; }
      else { sx = 272 + (n - 1) * 28; sy = 910; }
      ctx.drawImage(sprites, sx, sy, 24, 36, startX + i * dw, y, dw, dh);
    });
  }

  function drawIdleMessage() {
    // "Get Ready" 提示 (590,118,184,50)
    var rw = W * 0.35, rh = rw * 50 / 184;
    ctx.drawImage(sprites, 590, 118, 184, 50, W / 2 - rw / 2, H * 0.4, rw, rh);
    // 提示图标 (584,182,114,98)
    var tw = W * 0.2, th = tw * 98 / 114;
    ctx.drawImage(sprites, 584, 182, 114, 98, W / 2 - tw / 2, H * 0.55, tw, th);
  }

  function drawGameOver() {
    // 半透明遮罩
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);

    // Game Over 文字 (790,118,192,42)
    var gw = W * 0.4, gh = gw * 42 / 192;
    ctx.drawImage(sprites, 790, 118, 192, 42, W / 2 - gw / 2, H * 0.15, gw, gh);

    // 分数板 (6,518,226,114)
    var bw = W * 0.55, bh = bw * 114 / 226;
    var bx = W / 2 - bw / 2, by = H * 0.3;
    ctx.drawImage(sprites, 6, 518, 226, 114, bx, by, bw, bh);

    // 当前分数（小号数字）
    var smallDW = bw * 0.07, smallDH = bh * 0.18;
    var sDigits = score.toString().split('');
    var sTotalW = sDigits.length * smallDW;
    var sx = bx + bw * 0.75 - sTotalW / 2;
    var sy = by + bh * 0.28;
    sDigits.forEach(function(d, i) {
      var n = parseInt(d);
      var spx, spy;
      if (n === 0) { spx = 274; spy = 612; }
      else if (n === 1) { spx = 278; spy = 954; }
      else if (n === 2) { spx = 274; spy = 978; }
      else if (n === 3) { spx = 262; spy = 1002; }
      else if (n === 4) { spx = 1004; spy = 0; }
      else if (n === 5) { spx = 1004; spy = 24; }
      else if (n === 6) { spx = 1010; spy = 52; }
      else if (n === 7) { spx = 1010; spy = 84; }
      else if (n === 8) { spx = 586; spy = 484; }
      else if (n === 9) { spx = 622; spy = 412; }
      ctx.drawImage(sprites, spx, spy, 14, 20, sx + i * smallDW, sy, smallDW, smallDH);
    });

    // 重新开始按钮 (708,236,104,58)
    var rw = W * 0.25, rh = rw * 58 / 104;
    ctx.drawImage(sprites, 708, 236, 104, 58, W / 2 - rw / 2, H * 0.7, rw, rh);

    // 重新开始点击区域
    var _restartX = W / 2 - rw / 2, _restartY = H * 0.7;
    var _restartW = rw, _restartH = rh;
    window._restartRect = { x: _restartX, y: _restartY, w: _restartW, h: _restartH };
  }

  // ---------- 主循环 ----------
  function update() {
    if (state === STATE.PLAYING) {
      bird.update();

      if (bird.hitGround()) {
        state = STATE.OVER;
        return;
      }

      for (var i = 0; i < pipes.length; i++) {
        pipes[i].x -= pipeSpeed;
        if (hitPipe(pipes[i])) {
          state = STATE.OVER;
          return;
        }
        if (!pipes[i].scored && pipes[i].x + pipeW < bird.x) {
          pipes[i].scored = true;
          score++;
        }
      }

      if (pipes[0].x + pipeW < -50) {
        pipes.shift();
        pipes.push(createPipe(pipes[pipes.length - 1].x + W * 0.7));
      }

      groundOffset += pipeSpeed;
    }
  }

  function draw() {
    // 天空背景
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, W, H);

    // 水管
    pipes.forEach(function(p) { drawPipe(p); });

    // 地面
    drawGround();

    // 小鸟
    bird.draw();

    // 分数 / 提示
    if (state !== STATE.IDLE) drawScore();
    if (state === STATE.IDLE) drawIdleMessage();
    if (state === STATE.OVER) drawGameOver();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // ---------- 输入 ----------
  function handleInput(clientX, clientY) {
    if (state === STATE.IDLE) {
      state = STATE.PLAYING;
      bird.vy = bird.jumpV;
    } else if (state === STATE.PLAYING) {
      bird.vy = bird.jumpV;
    } else if (state === STATE.OVER) {
      var r = window._restartRect;
      if (r && clientX >= r.x && clientX <= r.x + r.w &&
          clientY >= r.y && clientY <= r.y + r.h) {
        restart();
      }
    }
  }

  document.addEventListener('click', function(e) {
    e.preventDefault();
    handleInput(e.clientX, e.clientY);
  });
  document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      handleInput(0, 0);
    }
  });

  function restart() {
    state = STATE.IDLE;
    score = 0;
    bird.reset();
    resetPipes();
    groundOffset = 0;
  }

  // ---------- 启动 ----------
  sprites.onload = function() {
    bird.reset();
    resetPipes();
    loop();
  };
  sprites.onerror = function() {
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('图片加载失败，请检查 flappy-bird.png', W / 2, H / 2);
    ctx.textAlign = 'start';
  };
})();