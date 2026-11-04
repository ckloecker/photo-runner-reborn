const PALETTES = {
  jungle: { surface: "#80c85a", fill: "#75533a", accent: "#b1ef78", glow: "#a7e86c" },
  desert: { surface: "#edc66c", fill: "#a98154", accent: "#fff0a1", glow: "#ffc94d" },
  underwater: { surface: "#55b9bd", fill: "#688e99", accent: "#92e8de", glow: "#69dcdf" }
};

function cameraFor(run, width, height, touch) {
  const level = run.level;
  const zoom = touch && run.timerStarted ? 1.5 : 1;
  const scale = Math.min(width / level.width, height / level.height) * zoom;
  const viewWidth = width / scale;
  const viewHeight = height / scale;
  let x = (level.width - viewWidth) / 2;
  let y = (level.height - viewHeight) / 2;
  if (zoom > 1) {
    x = run.player.x + run.player.width / 2 - viewWidth / 2;
    y = run.player.y + run.player.height / 2 - viewHeight / 2;
    x = Math.max(0, Math.min(level.width - viewWidth, x));
    y = Math.max(0, Math.min(level.height - viewHeight, y));
  }
  return { scale, x, y };
}

function path(ctx, points, close = false) {
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  });
  if (close) ctx.closePath();
}

function drawBackdrop(ctx, run, photo, camera, now, reducedMotion) {
  const { width, height } = run.level;
  const palette = PALETTES[run.level.biome];
  if (photo) {
    ctx.save();
    ctx.globalAlpha = 0.67;
    ctx.drawImage(photo, 0, 0, width, height);
    ctx.restore();
  } else {
    ctx.fillStyle = "#182532";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.fillStyle = "rgba(12, 21, 31, 0.2)";
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.globalAlpha = 0.28;
  for (let index = 0; index < 14; index += 1) {
    const phase = reducedMotion ? 0 : now / 1800;
    const x = (index * 47 + Math.sin(phase + index) * 7) % width;
    const y = (index * 31 + Math.cos(phase * 0.7 + index * 2) * 5 + height) % height;
    ctx.fillStyle = palette.glow;
    if (run.level.biome === "underwater") {
      ctx.beginPath();
      ctx.arc(x, y, 0.6 + index % 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (run.level.biome === "desert") {
      ctx.fillRect(x, y, 0.4, height * 0.18);
    } else {
      ctx.beginPath();
      ctx.ellipse(x, y, 1.2, 0.45, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawScenery(ctx, run) {
  const palette = PALETTES[run.level.biome];
  ctx.save();
  ctx.globalAlpha = 0.55;
  for (const item of run.level.scenery) {
    const size = item.scale * 3;
    if (item.kind === "jungle") {
      ctx.fillStyle = "#385c44";
      ctx.fillRect(item.x - 0.6, item.y, 1.2, size * 2.2);
      ctx.fillStyle = "#4d9160";
      ctx.beginPath();
      ctx.arc(item.x, item.y, size, 0, Math.PI * 2);
      ctx.arc(item.x - size * 0.7, item.y + size * 0.35, size * 0.7, 0, Math.PI * 2);
      ctx.arc(item.x + size * 0.8, item.y + size * 0.45, size * 0.75, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.kind === "desert") {
      ctx.fillStyle = "#a47d4d";
      ctx.beginPath();
      ctx.ellipse(item.x, item.y + size, size, size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#64834d";
      ctx.fillRect(item.x - 0.7, item.y - size, 1.4, size * 2);
      ctx.fillRect(item.x - 2.8, item.y - size * 0.25, 2, 1);
    } else {
      ctx.fillStyle = "#367e86";
      ctx.beginPath();
      ctx.arc(item.x, item.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(item.x, item.y + size);
      ctx.lineTo(item.x - size * 0.45, item.y + size * 2);
      ctx.moveTo(item.x, item.y + size);
      ctx.lineTo(item.x + size * 0.55, item.y + size * 1.8);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawTerrain(ctx, run) {
  const { width, height, biome } = run.level;
  const palette = PALETTES[biome];
  for (let y = 0; y < height; y += 1) {
    let start = -1;
    for (let x = 0; x <= width; x += 1) {
      const solid = x < width && run.terrain[y * width + x];
      if (solid && start < 0) start = x;
      if (!solid && start >= 0) {
        const segmentWidth = x - start;
        ctx.fillStyle = palette.fill;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(start, y, segmentWidth, 1);
        ctx.globalAlpha = 1;
        ctx.fillStyle = palette.surface;
        for (let edgeX = start; edgeX < x; edgeX += 1) {
          const offset = y * width + edgeX;
          if (y === 0 || !run.terrain[offset - width]) ctx.fillRect(edgeX, y, 1, 0.18);
          if (y === height - 1 || !run.terrain[offset + width]) ctx.fillRect(edgeX, y + 0.82, 1, 0.18);
          if (edgeX === 0 || !run.terrain[offset - 1]) ctx.fillRect(edgeX, y, 0.18, 1);
          if (edgeX === width - 1 || !run.terrain[offset + 1]) ctx.fillRect(edgeX + 0.82, y, 0.18, 1);
          if (run.level.nonDrillable[offset] && (edgeX + y) % 3 === 0) {
            ctx.fillStyle = "#f4e3a8";
            ctx.fillRect(edgeX + 0.25, y + 0.25, 0.25, 0.25);
            ctx.fillStyle = palette.surface;
          }
        }
        start = -1;
      }
    }
  }
}

function drawCheckpoints(ctx, run) {
  for (const checkpoint of run.checkpoints) {
    if (checkpoint.collected) continue;
    ctx.save();
    ctx.shadowColor = "#80f7ff";
    ctx.shadowBlur = 7;
    ctx.fillStyle = "#bbfbff";
    ctx.beginPath();
    ctx.arc(checkpoint.x, checkpoint.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = "#efffff";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(checkpoint.x, checkpoint.y, 3.2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawGate(ctx, run) {
  const gate = run.level.finish;
  const bannerY = gate.y;
  ctx.fillStyle = "#f3eee1";
  ctx.fillRect(gate.x, bannerY, 1.1, gate.height);
  ctx.fillRect(gate.x + gate.width - 1.1, bannerY, 1.1, gate.height);
  ctx.fillStyle = "#fbf7e9";
  ctx.fillRect(gate.x, bannerY, gate.width, 7);
  const tile = 1.8;
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < Math.ceil(gate.width / tile); x += 1) {
      if ((x + y) % 2 === 0) {
        ctx.fillStyle = "#17202a";
        ctx.fillRect(gate.x + x * tile, bannerY + y * tile, tile, tile);
      }
    }
  }
  if (run.finishLocked) {
    ctx.strokeStyle = "#eb334c";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(gate.x + 1, bannerY + 1);
    ctx.lineTo(gate.x + gate.width - 1, bannerY + 6);
    ctx.moveTo(gate.x + gate.width - 1, bannerY + 1);
    ctx.lineTo(gate.x + 1, bannerY + 6);
    ctx.stroke();
    ctx.fillStyle = "#e9414f";
    ctx.fillRect(gate.x + 1, bannerY + 8, gate.width - 2, 0.8);
    ctx.fillStyle = "#ffd45f";
    ctx.fillRect(gate.x + gate.width / 2 - 1.1, bannerY + 10, 2.2, 2);
    ctx.strokeStyle = "#ffe6a4";
    ctx.lineWidth = 0.7;
    ctx.strokeRect(gate.x + gate.width / 2 - 1.5, bannerY + 8.5, 3, 3);
  }
}

function drawPlatforms(ctx, run) {
  for (const platform of run.platforms) {
    ctx.fillStyle = "#c19b66";
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    ctx.fillStyle = "#f0d39a";
    ctx.fillRect(platform.x, platform.y, platform.width, 0.6);
    ctx.strokeStyle = "#493c33";
    ctx.lineWidth = 0.28;
    ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
  }
}

function drawPickups(ctx, run, now) {
  for (const pickup of run.pickups) {
    if (pickup.collected) continue;
    const centerX = pickup.x + pickup.width / 2;
    const centerY = pickup.y + pickup.height / 2;
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = pickup.type === "speed" ? "#ffed55" : "#ff66c4";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6 + Math.sin(now / 250) * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (pickup.type === "speed") {
      ctx.fillStyle = "#ffe630";
      ctx.strokeStyle = "#493428";
      ctx.lineWidth = 0.6;
      path(ctx, [
        [centerX + 0.5, centerY - 3.8],
        [centerX - 2, centerY + 0.1],
        [centerX - 0.1, centerY + 0.1],
        [centerX - 1, centerY + 3.7],
        [centerX + 2.5, centerY - 0.8],
        [centerX + 0.4, centerY - 0.8]
      ], true);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = "#f447a8";
      ctx.strokeStyle = "#402b43";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY - 1, 3.2, 2.3, 0, Math.PI, 0);
      ctx.lineTo(centerX + 3.2, centerY + 1.5);
      ctx.lineTo(centerX - 3.2, centerY + 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fff1df";
      ctx.fillRect(centerX - 1, centerY + 1.4, 2, 2.2);
      ctx.fillStyle = "#fff6ec";
      ctx.beginPath();
      ctx.arc(centerX - 1, centerY - 1.4, 0.5, 0, Math.PI * 2);
      ctx.arc(centerX + 1, centerY - 0.5, 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawEnemy(ctx, run, enemy) {
  const palette = PALETTES[run.level.biome];
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  if (run.level.biome === "jungle") {
    ctx.fillStyle = "#f3c83d";
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.6, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(206, 247, 221, 0.62)";
    ctx.beginPath();
    ctx.ellipse(-2.2, -1.5, 1.8, 1.1, -0.5, 0, Math.PI * 2);
    ctx.ellipse(2.2, -1.5, 1.8, 1.1, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#373d32";
    ctx.beginPath();
    ctx.moveTo(-2, 1);
    ctx.lineTo(-3, 3);
    ctx.moveTo(2, 1);
    ctx.lineTo(3, 3);
    ctx.stroke();
  } else if (run.level.biome === "desert") {
    ctx.fillStyle = "#bf9555";
    ctx.beginPath();
    ctx.ellipse(0, 0, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#533c34";
    ctx.fillRect(-1.4, -0.7, 0.6, 0.6);
    ctx.fillRect(0.8, -0.7, 0.6, 0.6);
    ctx.strokeStyle = palette.accent;
    ctx.strokeRect(-3.2, -2.2, 6.4, 4.4);
  } else {
    ctx.fillStyle = "#bba5ef";
    ctx.beginPath();
    ctx.ellipse(0, -0.5, 2.8, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#645b9e";
    for (let arm = -1; arm <= 1; arm += 1) {
      ctx.beginPath();
      ctx.moveTo(arm * 1.8, 1);
      ctx.quadraticCurveTo(arm * 2.1, 2.8, arm * 2.6, 3.4);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawPlayer(ctx, run, now) {
  const player = run.player;
  const x = player.x;
  const y = player.y;
  const underwaterSwim = run.level.biome === "underwater" && player.climbing;
  const climbPose = player.climbing && !underwaterSwim;
  const step = Math.floor(now / 110) % 2;
  const palette = PALETTES[run.level.biome];
  if (player.dustUntil > now) {
    ctx.fillStyle = "#eee4d0";
    for (let puff = 0; puff < 4; puff += 1) {
      const px = x + (player.dustDirection > 0 ? player.width + 0.5 : -1.1) +
        ((puff % 2) * 0.8);
      const py = y + player.height - 2 + Math.floor(puff / 2) * 1.2;
      ctx.fillRect(px, py, 0.8, 0.8);
    }
  }
  ctx.save();
  ctx.translate(x + (player.facing < 0 ? player.width : 0), y);
  ctx.scale(player.facing < 0 ? -1 : 1, 1);
  ctx.fillStyle = "#d99b69";
  ctx.fillRect(2, 2, 3, 2.2);
  ctx.fillStyle = "#1f787b";
  ctx.fillRect(1.3, 4, 4, 3.1);
  ctx.fillStyle = "#f1813d";
  ctx.fillRect(0.5, 4, 1.7, 1.1);
  ctx.fillStyle = "#233e48";
  ctx.fillRect(1.5, 7, 1.2, 2);
  ctx.fillRect(4, 7, 1.2, 2);
  if (climbPose) {
    ctx.fillStyle = "#d99b69";
    ctx.fillRect(0.2, 3.2 + step * 0.4, 1, 1.1);
    ctx.fillRect(4.8, 3.1 + (1 - step) * 0.4, 1, 1.1);
  } else if (underwaterSwim) {
    ctx.fillStyle = "#d99b69";
    ctx.fillRect(0.2, 5, 1.4, 0.8);
    ctx.fillRect(4.6, 5.2, 1.4, 0.8);
    ctx.fillStyle = "#8be5df";
    ctx.fillRect(0.2, 7 + step * 0.3, 1.3, 0.6);
    ctx.fillRect(4.6, 7 + (1 - step) * 0.3, 1.3, 0.6);
  } else {
    ctx.fillStyle = "#d99b69";
    ctx.fillRect(0.4, 4.5, 1, 2);
    ctx.fillRect(5, 4.5, 1, 2);
  }
  ctx.fillStyle = "#142f37";
  ctx.fillRect(4.2, 2.7, 0.5, 0.5);
  if (run.level.biome === "jungle") {
    ctx.fillStyle = "#d9b36b";
    ctx.fillRect(1, 0.6, 4.5, 0.8);
    ctx.fillRect(1.7, 0, 3.1, 0.8);
    ctx.fillStyle = "#6b9b57";
    ctx.fillRect(4.3, 0.7, 0.8, 0.5);
  } else if (run.level.biome === "desert") {
    ctx.fillStyle = "#92683d";
    ctx.fillRect(0.6, 1, 5, 0.7);
    ctx.fillRect(1.5, 0.2, 3.8, 0.7);
    ctx.fillRect(2.2, -0.1, 2.5, 0.5);
  } else {
    ctx.strokeStyle = "#c4e7e2";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(0.4, 0.1, 5.2, 2.6);
    ctx.fillStyle = "#9ce5df";
    ctx.fillRect(1, 0.1, 4, 0.5);
  }
  if (run.level.combat) {
    ctx.fillStyle = "#393d48";
    ctx.fillRect(5.2, 4.5, 1.2, 0.7);
    ctx.fillRect(5.8, 5.1, 0.5, 0.7);
  }
  if (palette) ctx.restore();
}

function drawRun(ctx, run, now) {
  for (const enemy of run.enemies) {
    if (!enemy.defeated) drawEnemy(ctx, run, enemy);
  }
  for (const projectile of run.projectiles) {
    ctx.fillStyle = "#ffdf74";
    ctx.fillRect(projectile.x - 0.7, projectile.y - 0.25, 1.4, 0.5);
  }
  drawPlayer(ctx, run, now);
  for (const label of run.labels) {
    const elapsed = now - label.startedAt;
    if (elapsed < 1500) {
      ctx.globalAlpha = 1 - elapsed / 1500;
      ctx.fillStyle = "#fff";
      ctx.font = "bold 3px sans-serif";
      ctx.fillText("-2s", label.x, label.y - elapsed / 400);
      ctx.globalAlpha = 1;
    }
  }
}

export function drawGame(canvas, run, photo, { now = 0, touch = false, reducedMotion = false } = {}) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const camera = cameraFor(run, canvas.width, canvas.height, touch);
  ctx.save();
  ctx.fillStyle = "#101923";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.translate((canvas.width - run.level.width * camera.scale) / 2, (canvas.height - run.level.height * camera.scale) / 2);
  ctx.scale(camera.scale, camera.scale);
  ctx.translate(-camera.x, -camera.y);
  drawBackdrop(ctx, run, photo, camera, now, reducedMotion);
  drawScenery(ctx, run);
  drawTerrain(ctx, run);
  drawPlatforms(ctx, run);
  drawCheckpoints(ctx, run);
  drawPickups(ctx, run, reducedMotion ? 0 : now);
  drawGate(ctx, run);
  drawRun(ctx, run, now);
  ctx.restore();
}

export function drawPreview(canvas, option, photo, reducedMotion = false) {
  const mockRun = {
    level: option,
    player: {
      ...option.playerStart,
      width: 6,
      height: 9,
      facing: 1,
      climbing: false,
      dustUntil: 0,
      speedUntil: 0
    },
    terrain: option.terrain,
    checkpoints: option.checkpoints,
    pickups: option.pickups,
    platforms: option.platforms,
    enemies: option.enemies,
    projectiles: [],
    labels: [],
    finishLocked: option.checkpoints.length > 0,
    timerStarted: false,
    completed: false
  };
  drawGame(canvas, mockRun, photo, { reducedMotion });
}
