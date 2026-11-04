const CELL_SIZE = 8;
const PLAYER_WIDTH = 6;
const PLAYER_HEIGHT = 9;
const GRAVITY = 220;
const JUMP_VELOCITY = -Math.sqrt(2 * GRAVITY * 38.6);
const NORMAL_SPEED = 80;
const CLIMB_SPEED = NORMAL_SPEED / 4;
const ACTIVE_DRILL_SPEED = 10;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, amount) => a + (b - a) * amount;

export function createRandom(seed = 1) {
  let state = typeof seed === "string" ? hashString(seed) : Number(seed) >>> 0;
  if (!state) state = 0x6d2b79f5;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hashText(value) {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  let third = 0x85ebca6b;
  let fourth = 0xc2b2ae35;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193);
    second = Math.imul(second ^ (code + index), 0x85ebca6b);
    third = Math.imul(third ^ (code + first), 0xc2b2ae35);
    fourth = Math.imul(fourth ^ (code + second), 0x27d4eb2f);
  }
  return [first, second, third, fourth]
    .map((part) => (part >>> 0).toString(16).padStart(8, "0"))
    .join("");
}

export function isValidPlayerName(name) {
  return typeof name === "string" && name.length >= 1 && name.length <= 32 &&
    /^\p{L}+(?: \p{L}+)*$/u.test(name);
}

function luminanceAt(image, x, y) {
  const sourceX = clamp(Math.floor((x / image.gridWidth) * image.width), 0, image.width - 1);
  const sourceY = clamp(Math.floor((y / image.gridHeight) * image.height), 0, image.height - 1);
  const offset = (sourceY * image.width + sourceX) * 4;
  return (image.data[offset] * 0.2126 + image.data[offset + 1] * 0.7152 +
    image.data[offset + 2] * 0.0722);
}

export function findPhotoEdges(image, width, height) {
  const source = {
    data: image.data,
    width: image.width,
    height: image.height,
    gridWidth: width,
    gridHeight: height
  };
  const luminance = new Float32Array(width * height);
  let min = Infinity;
  let max = -Infinity;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const value = luminanceAt(source, x, y);
      luminance[y * width + x] = value;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }
  if (max - min < 9) return [];
  const magnitude = new Float32Array(width * height);
  const strengths = [];
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const at = (row, column) => luminance[row * width + column];
      const gx = -at(y - 1, x - 1) + at(y - 1, x + 1) -
        2 * at(y, x - 1) + 2 * at(y, x + 1) -
        at(y + 1, x - 1) + at(y + 1, x + 1);
      const gy = -at(y - 1, x - 1) - 2 * at(y - 1, x) - at(y - 1, x + 1) +
        at(y + 1, x - 1) + 2 * at(y + 1, x) + at(y + 1, x + 1);
      const value = Math.hypot(gx, gy) / 4;
      magnitude[y * width + x] = value;
      if (value > 0) strengths.push(value);
    }
  }
  if (strengths.length < width) return [];
  strengths.sort((a, b) => a - b);
  const cutoff = Math.max(12, strengths[Math.floor(strengths.length * 0.78)] * 0.7);
  const edges = [];
  const runMinimum = Math.max(7, Math.floor(Math.min(width, height) * 0.09));
  for (let y = 2; y < height - 2; y += 1) {
    let start = -1;
    let strength = 0;
    for (let x = 2; x <= width - 2; x += 1) {
      const value = magnitude[y * width + x];
      if (value >= cutoff) {
        if (start < 0) start = x;
        strength += value;
      } else if (start >= 0) {
        if (x - start >= runMinimum) {
          edges.push({ orientation: "horizontal", x: start, y, length: x - start, strength });
        }
        start = -1;
        strength = 0;
      }
    }
  }
  for (let x = 2; x < width - 2; x += 1) {
    let start = -1;
    let strength = 0;
    for (let y = 2; y <= height - 2; y += 1) {
      const value = magnitude[y * width + x];
      if (value >= cutoff) {
        if (start < 0) start = y;
        strength += value;
      } else if (start >= 0) {
        if (y - start >= runMinimum) {
          edges.push({ orientation: "vertical", x, y: start, length: y - start, strength });
        }
        start = -1;
        strength = 0;
      }
    }
  }
  return edges.sort((a, b) => b.strength - a.strength).slice(0, 100);
}

function shuffled(values, random) {
  const result = values.slice();
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function makeOption(image, edges, index, pair, random, seed) {
  const width = 128;
  const height = clamp(Math.round(width * image.height / image.width), 56, 144);
  const terrain = Array(width * height).fill(false);
  const nonDrillable = Array(width * height).fill(false);
  const photoTerrain = Array(width * height).fill(false);
  const edgeOrientation = pair.layout === "horizontal"
    ? "horizontal"
    : pair.layout === "vertical" ? "vertical" : null;
  const rankedEdges = edges.slice().sort((a, b) => {
    if (!edgeOrientation) return b.strength - a.strength;
    const aMatches = a.orientation === edgeOrientation;
    const bMatches = b.orientation === edgeOrientation;
    return Number(bMatches) - Number(aMatches) || b.strength - a.strength;
  });
  const finishSide = ["left", "right", "top", "bottom"][Math.floor(random() * 4)];
  const startSide = ({ left: "right", right: "left", top: "bottom", bottom: "top" })[finishSide];
  const verticalCourse = finishSide === "top" || finishSide === "bottom";
  const routeCount = 5 + Math.floor(random() * 3);
  const start = endpoint(startSide, width, height, random);
  const finish = endpoint(finishSide, width, height, random, true);
  const route = [];
  for (let point = 0; point < routeCount; point += 1) {
    const progress = point / (routeCount - 1);
    const wave = point === 0 || point === routeCount - 1
      ? 0
      : point % 2 ? -12 : 7;
    const jumpWave = verticalCourse && point === Math.floor((routeCount - 1) / 2) ? -20 : 0;
    const centerX = lerp(start.x + PLAYER_WIDTH / 2, finish.x + PLAYER_WIDTH / 2, progress) +
      (verticalCourse ? wave : 0);
    const centerY = lerp(start.y + PLAYER_HEIGHT, finish.y + PLAYER_HEIGHT, progress) +
      (verticalCourse ? jumpWave : wave);
    const platformWidth = verticalCourse
      ? point > 0 && point < routeCount - 1 && point % 2 ? 0 : 6
      : 14;
    const previousCenterX = route[point - 1]?.x + PLAYER_WIDTH / 2;
    const approachOffset = verticalCourse && point > 0
      ? previousCenterX < centerX ? 1 : -platformWidth - 1
      : -platformWidth / 2;
    const platformX = Math.round(clamp(centerX + approachOffset, 2, width - platformWidth - 2));
    const platformY = Math.round(clamp(centerY, 5, height - 4));
    route.push({
      x: Math.round(clamp(centerX - PLAYER_WIDTH / 2, 3, width - PLAYER_WIDTH - 3)),
      y: Math.round(clamp(platformY - PLAYER_HEIGHT, 3, height - PLAYER_HEIGHT - 2)),
      platformX,
      platformY,
      width: platformWidth
    });
  }
  route[0].x = start.x;
  route[0].y = start.y;
  route[route.length - 1].x = finish.x;
  route[route.length - 1].y = finish.y;
  route[0].platformX = clamp(start.x - 4, 2, width - route[0].width - 2);
  route[0].platformY = start.y + PLAYER_HEIGHT;
  route[route.length - 1].platformX = clamp(finish.x - 4, 2, width - route[route.length - 1].width - 2);
  route[route.length - 1].platformY = finish.y + PLAYER_HEIGHT;
  for (let index = 0; index < route.length; index += 1) {
    const point = route[index];
    const previous = route[index - 1] || route[index + 1];
    const approachFromLeft = previous.x < point.x;
    const preferredX = approachFromLeft
      ? point.x + PLAYER_WIDTH - 2
      : point.x - point.width + 2;
    const candidates = [];
    for (let platformX = 2; platformX <= width - point.width - 2; platformX += 1) {
      const overlapWithWaypoint = Math.min(platformX + point.width, point.x + PLAYER_WIDTH) -
        Math.max(platformX, point.x);
      if (overlapWithWaypoint < 2) continue;
      const blocksAnotherWaypoint = route.some((other, otherIndex) => {
        if (otherIndex === index || point.platformY < other.y ||
            point.platformY >= other.y + PLAYER_HEIGHT) return false;
        return platformX < other.x + PLAYER_WIDTH && platformX + point.width > other.x;
      });
      if (!blocksAnotherWaypoint) candidates.push(platformX);
    }
    if (candidates.length) {
      candidates.sort((left, right) =>
        Math.abs(left - preferredX) - Math.abs(right - preferredX)
      );
      point.platformX = candidates[0];
    }
  }

  const clearRoute = (point) => {
    const left = Math.floor(point.x - 3);
    const top = Math.floor(point.y - 40);
    for (let y = top; y < point.y + PLAYER_HEIGHT + 3; y += 1) {
      for (let x = left; x < point.x + PLAYER_WIDTH + 4; x += 1) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const offset = y * width + x;
          terrain[offset] = false;
          nonDrillable[offset] = false;
        }
      }
    }
  };
  const routeSamples = [];
  for (let index = 0; index < route.length - 1; index += 1) {
    const from = route[index];
    const to = route[index + 1];
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const count = Math.max(1, Math.ceil(distance / 3));
    for (let sample = 0; sample <= count; sample += 1) {
      const progress = sample / count;
      const point = {
        x: lerp(from.x, to.x, progress),
        y: lerp(from.y, to.y, progress)
      };
      routeSamples.push(point);
      clearRoute(point);
    }
  }

  const usedEdges = [];
  for (const edge of rankedEdges) {
    if (usedEdges.length >= 18) break;
    const horizontal = edge.orientation === "horizontal";
    const x = Math.round(edge.x);
    const y = Math.round(edge.y);
    const length = Math.max(4, Math.round(edge.length));
    const edgeX = horizontal ? x : clamp(x, 2, width - 3);
    const edgeY = horizontal ? clamp(y, 3, height - 4) : y;
    const intersectsRoute = routeSamples.some((point) => {
      if (horizontal) {
        const withinRun = point.x + PLAYER_WIDTH >= edgeX - 8 && point.x <= edgeX + length + 8;
        return withinRun && Math.abs(point.y + PLAYER_HEIGHT - edgeY) < 42;
      }
      const withinRun = point.y + PLAYER_HEIGHT >= edgeY - 8 &&
        point.y <= edgeY + length + 8;
      return withinRun && Math.abs(point.x + PLAYER_WIDTH / 2 - edgeX) < 10;
    });
    if (intersectsRoute) continue;
    if (horizontal) {
      for (let offset = 0; offset < length; offset += 1) {
        const px = edgeX + offset;
        if (px >= 0 && px < width) {
          terrain[edgeY * width + px] = true;
          photoTerrain[edgeY * width + px] = true;
          if (edgeY + 1 < height) terrain[(edgeY + 1) * width + px] = true;
          if (edgeY + 1 < height) photoTerrain[(edgeY + 1) * width + px] = true;
        }
      }
    } else {
      for (let offset = 0; offset < length; offset += 1) {
        const py = edgeY + offset;
        if (py >= 0 && py < height) {
          terrain[py * width + edgeX] = true;
          photoTerrain[py * width + edgeX] = true;
          if (edgeX + 1 < width) terrain[py * width + edgeX + 1] = true;
          if (edgeX + 1 < width) photoTerrain[py * width + edgeX + 1] = true;
        }
      }
    }
    usedEdges.push({ ...edge, x: edgeX, y: edgeY, length });
  }

  const visitedPhotoCells = new Uint8Array(width * height);
  const requiredPhotoWidth = verticalCourse ? 12 : Math.ceil(width / 5);
  const requiredPhotoHeight = verticalCourse ? Math.ceil(height / 5) : 4;
  for (let offset = 0; offset < photoTerrain.length; offset += 1) {
    if (!photoTerrain[offset] || visitedPhotoCells[offset]) continue;
    const component = [offset];
    visitedPhotoCells[offset] = 1;
    for (let cursor = 0; cursor < component.length; cursor += 1) {
      const current = component[cursor];
      const cellX = current % width;
      const cellY = Math.floor(current / width);
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const x = cellX + dx;
          const y = cellY + dy;
          if (x < 0 || x >= width || y < 0 || y >= height) continue;
          const next = y * width + x;
          if (!photoTerrain[next] || visitedPhotoCells[next]) continue;
          visitedPhotoCells[next] = 1;
          component.push(next);
        }
      }
    }
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    let safeToProtect = true;
    for (const cell of component) {
      const x = cell % width;
      const y = Math.floor(cell / width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      if (routeSamples.some((point) =>
        Math.abs(x + 0.5 - point.x - PLAYER_WIDTH / 2) < 10 &&
        Math.abs(y + 0.5 - point.y - PLAYER_HEIGHT / 2) < 16
      ) || Math.hypot(x + 0.5 - start.x, y + 0.5 - start.y) < 14 ||
        Math.hypot(x + 0.5 - finish.x, y + 0.5 - finish.y) < 14) {
        safeToProtect = false;
        break;
      }
    }
    if (safeToProtect && maxX - minX + 1 >= requiredPhotoWidth &&
        maxY - minY + 1 >= requiredPhotoHeight) {
      for (const cell of component) nonDrillable[cell] = true;
    }
  }

  const scenery = makeScenery(pair.biome, random, width, height);
  for (const item of scenery) {
    const centerX = Math.round(item.x);
    const topY = Math.round(item.y);
    const nearRoute = routeSamples.some((point) =>
      Math.abs(point.x - centerX) < 12 && topY >= point.y - 42 && topY <= point.y + 12
    );
    if (nearRoute || Math.abs(start.x - centerX) < 14 || Math.abs(finish.x - centerX) < 14) continue;
    const cells = [];
    if (pair.biome === "jungle") {
      for (let y = topY; y < topY + 15 * item.scale; y += 1) cells.push([centerX, y]);
      for (let y = topY; y < topY + 6; y += 1) {
        for (let x = centerX - (6 - y + topY); x <= centerX + (6 - y + topY); x += 1) {
          cells.push([x, y]);
        }
      }
    } else if (pair.biome === "desert") {
      for (let y = topY; y < topY + 8 * item.scale; y += 1) cells.push([centerX, y]);
      for (let y = topY + 3; y < topY + 6; y += 1) {
        cells.push([centerX - 2, y], [centerX + 1, y]);
      }
    } else {
      for (let y = topY; y < topY + 8 * item.scale; y += 1) cells.push([centerX, y]);
      for (let offset = 1; offset < 6; offset += 1) {
        cells.push([centerX - offset, topY + offset], [centerX + offset, topY + offset]);
      }
    }
    for (const [x, y] of cells) {
      if (x >= 1 && x < width - 1 && y >= 1 && y < height - 2) {
        terrain[y * width + x] = true;
      }
    }
  }

  for (const point of routeSamples) clearRoute(point);

  for (const point of route) {
    for (let offset = 0; offset < point.width; offset += 1) {
      const x = point.platformX + offset;
      if (x < 0 || x >= width) continue;
      for (let thick = 0; thick < 2; thick += 1) {
        const y = point.platformY + thick;
        if (y < height) terrain[y * width + x] = true;
      }
    }
  }

  const checkpointCount = 1 + Math.floor(random() * 2);
  const checkpoints = [];
  for (let checkpoint = 0; checkpoint < checkpointCount; checkpoint += 1) {
    const routeIndex = Math.max(1, Math.min(route.length - 2,
      Math.round((checkpoint + 1) * (route.length - 1) / (checkpointCount + 1))));
    checkpoints.push({
      x: route[routeIndex].x + PLAYER_WIDTH / 2,
      y: route[routeIndex].y + PLAYER_HEIGHT / 2,
      collected: false
    });
  }

  const platformClear = (x, y) => {
    for (let cellY = Math.floor(y); cellY < Math.floor(y) + 3; cellY += 1) {
      for (let cellX = Math.floor(x); cellX < Math.floor(x) + 12; cellX += 1) {
        if (cellX < 1 || cellX >= width - 1 || cellY < 1 || cellY >= height - 1 ||
            terrain[cellY * width + cellX]) return false;
      }
    }
    return true;
  };
  const platforms = Array.from({ length: 2 }, (_, platformIndex) => {
    let position = null;
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const candidate = {
        x: 8 + Math.floor(random() * (width - 28)),
        y: 8 + Math.floor(random() * (height - 20))
      };
      const courseClear = routeSamples.every((point) =>
        Math.abs(point.x - candidate.x) > 14 || Math.abs(point.y - candidate.y) > 12
      );
      if (courseClear && platformClear(candidate.x, candidate.y)) {
        position = candidate;
        break;
      }
    }
    if (!position) position = { x: platformIndex ? width - 22 : 8, y: 4 + platformIndex * 4 };
    let minX = position.x;
    let maxX = position.x;
    while (minX > 2 && platformClear(minX - 1, position.y)) minX -= 1;
    while (maxX < width - 14 && platformClear(maxX + 1, position.y)) maxX += 1;
    return {
      x: position.x,
      y: position.y,
      width: 12,
      height: 3,
      minX,
      maxX,
      direction: platformIndex % 2 ? -1 : 1,
      initialX: position.x
    };
  });
  const pickups = [];
  const overlaps = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x &&
    a.y < b.y + b.height && a.y + a.height > b.y;
  const pickupPositionIsValid = (candidate, allowCarving) => {
    const pickupBounds = { ...candidate, width: 8, height: 8 };
    if (routeSamples.some((point) =>
      pickupBounds.x < point.x + PLAYER_WIDTH + 12 &&
      pickupBounds.x + pickupBounds.width > point.x - 12 &&
      pickupBounds.y < point.y + PLAYER_HEIGHT + 14 &&
      pickupBounds.y + pickupBounds.height > point.y - 14
    )) return false;
    if (overlaps(pickupBounds, { ...start, width: PLAYER_WIDTH, height: PLAYER_HEIGHT }) ||
        overlaps(pickupBounds, { ...finish, width: 12, height: 18 }) ||
        pickups.some((pickup) => overlaps(pickupBounds, pickup))) return false;
    if (platforms.some((platform) =>
      pickupBounds.x < platform.maxX + platform.width &&
      pickupBounds.x + pickupBounds.width > platform.minX &&
      pickupBounds.y < platform.y + platform.height &&
      pickupBounds.y + pickupBounds.height > platform.y
    )) return false;
    for (let y = candidate.y; y < candidate.y + 8; y += 1) {
      for (let x = candidate.x; x < candidate.x + 8; x += 1) {
        const offset = y * width + x;
        if (terrain[offset] && (!allowCarving || nonDrillable[offset])) return false;
      }
    }
    return true;
  };
  const placePickup = (type, count) => {
    for (let pickup = 0; pickup < count; pickup += 1) {
      let candidate = null;
      for (let attempt = 0; attempt < 200; attempt += 1) {
        const position = {
          x: 2 + Math.floor(random() * (width - 12)),
          y: 2 + Math.floor(random() * (height - 12))
        };
        if (pickupPositionIsValid(position, false)) {
          candidate = position;
          break;
        }
      }
      if (!candidate) {
        for (let y = 2; y <= height - 10 && !candidate; y += 1) {
          for (let x = 2; x <= width - 10; x += 1) {
            if (pickupPositionIsValid({ x, y }, false)) {
              candidate = { x, y };
              break;
            }
          }
        }
      }
      if (!candidate) {
        for (let y = 2; y <= height - 10 && !candidate; y += 1) {
          for (let x = 2; x <= width - 10; x += 1) {
            if (pickupPositionIsValid({ x, y }, true)) {
              candidate = { x, y };
              break;
            }
          }
        }
      }
      if (!candidate) return false;
      for (let y = candidate.y; y < candidate.y + 8; y += 1) {
        for (let x = candidate.x; x < candidate.x + 8; x += 1) {
          terrain[y * width + x] = false;
        }
      }
      pickups.push({ type, ...candidate, width: 8, height: 8, collected: false });
    }
    return true;
  };
  const pickupsPlaced = placePickup("speed", 1 + Math.floor(random() * 3)) &&
    placePickup("mushroom", 1 + Math.floor(random() * 3));

  const combat = random() >= 0.35;
  const enemyCount = combat ? 4 + Math.floor(random() * 5) : 3;
  const enemies = [];
  const patrolIsSafe = (x, y, horizontal, vertical) => {
    for (let sample = 0; sample <= 100; sample += 1) {
      const progress = sample / 100;
      const patrolX = lerp(x - horizontal, x + horizontal, progress);
      const patrolY = lerp(y - vertical, y + vertical, progress);
      if (patrolX < 8 || patrolX > width - 14 || patrolY < 8 || patrolY > height - 14 ||
          routeSamples.some((point) =>
            Math.abs(point.x + PLAYER_WIDTH / 2 - patrolX) < 18 &&
            Math.abs(point.y + PLAYER_HEIGHT - patrolY) < 30
          ) ||
          Math.hypot(patrolX - start.x, patrolY - start.y) < 20 ||
          Math.hypot(patrolX - finish.x, patrolY - finish.y) < 20) return false;
      for (let cellY = Math.floor(patrolY - 2); cellY <= patrolY + 2; cellY += 1) {
        for (let cellX = Math.floor(patrolX - 2); cellX <= patrolX + 2; cellX += 1) {
          if (cellX >= 0 && cellX < width && cellY >= 0 && cellY < height &&
              terrain[cellY * width + cellX]) return false;
        }
      }
    }
    return true;
  };
  for (let enemyIndex = 0; enemyIndex < enemyCount; enemyIndex += 1) {
    let patrol = null;
    for (let attempt = 0; attempt < 160; attempt += 1) {
      const candidate = {
        x: 18 + random() * (width - 36),
        y: 12 + random() * (height - 24),
        horizontal: 3 + random() * 11,
        vertical: 3 + random() * 9
      };
      if (patrolIsSafe(candidate.x, candidate.y, candidate.horizontal, candidate.vertical)) {
        patrol = candidate;
        break;
      }
    }
    if (!patrol) {
      for (let y = 10; y < height - 12 && !patrol; y += 4) {
        for (let x = 10; x < width - 12 && !patrol; x += 4) {
          if (patrolIsSafe(x, y, 2, 2)) patrol = { x, y, horizontal: 2, vertical: 2 };
        }
      }
    }
    if (!patrol) break;
    const { x, y, horizontal, vertical } = patrol;
    const phase = random() * Math.PI * 2;
    const initialProgress = (Math.sin(phase) + 1) / 2;
    const path = [
      { x: clamp(x - horizontal, 8, width - 14), y: clamp(y - vertical, 8, height - 14) },
      { x: clamp(x + horizontal, 8, width - 14), y: clamp(y + vertical, 8, height - 14) }
    ];
    enemies.push({
      x: lerp(path[0].x, path[1].x, initialProgress),
      y: lerp(path[0].y, path[1].y, initialProgress),
      initialX: x,
      initialY: y,
      path,
      phase,
      defeated: false
    });
  }

  const identity = {
    seed,
    biome: pair.biome,
    layout: pair.layout,
    terrain: hashText(terrain.map(Number).join("")),
    start,
    finish
  };
  const option = {
    id: hashText(JSON.stringify(identity)),
    seed,
    biome: pair.biome,
    layout: pair.layout,
    width,
    height,
    cellSize: CELL_SIZE,
    terrain,
    nonDrillable,
    photoEdges: usedEdges,
    route: {
      verified: false,
      points: route.map((point) => ({
        x: point.x + PLAYER_WIDTH / 2,
        y: point.y + PLAYER_HEIGHT,
        supportX: point.platformX,
        supportY: point.platformY,
        supportWidth: point.width
      })),
      sectionCount: routeCount - 1
    },
    playerStart: start,
    finish: { ...finish, width: 12, height: 18, locked: true },
    checkpoints,
    platforms,
    pickups,
    enemies,
    combat,
    scenery
  };
  const expectedEnemyCount = combat ? enemyCount : 3;
  option.route.verified = pickupsPlaced && enemies.length === expectedEnemyCount &&
    verifyCourse(option);
  return option;
}

function endpoint(side, width, height, random, gate = false) {
  const objectWidth = gate ? 12 : PLAYER_WIDTH;
  const objectHeight = gate ? 18 : PLAYER_HEIGHT;
  const edgeGap = gate ? 3 : 5;
  const x = side === "left" ? edgeGap : side === "right" ? width - objectWidth - edgeGap :
    12 + Math.floor(random() * (width - objectWidth - 24));
  const y = side === "top" ? edgeGap : side === "bottom" ? height - objectHeight - edgeGap :
    12 + Math.floor(random() * (height - objectHeight - 24));
  return {
    x: Math.round(clamp(x, 2, width - objectWidth - 2)),
    y: Math.round(clamp(y, 2, height - objectHeight - 2))
  };
}

function makeScenery(biome, random, width, height) {
  return Array.from({ length: 5 }, (_, index) => ({
    kind: biome,
    x: 8 + random() * (width - 16),
    y: 8 + random() * (height - 16),
    scale: 0.7 + random() * 1.4,
    variant: index
  }));
}

export function verifyCourse(level) {
  const points = level.route?.points;
  if (!Array.isArray(points) || points.length < 5 || points.length > 7 ||
      level.route.sectionCount < 4 || level.route.sectionCount > 6 ||
      level.platforms.length !== 2) return false;
  for (const [index, point] of points.entries()) {
    const playerX = point.x - PLAYER_WIDTH / 2;
    const playerY = point.y - PLAYER_HEIGHT;
    if (playerX < 0 || playerY < 0 || playerX + PLAYER_WIDTH > level.width ||
        playerY + PLAYER_HEIGHT >= level.height) return false;
    if (index === 0 || index === points.length - 1) {
      for (let y = Math.floor(playerY); y < Math.ceil(playerY + PLAYER_HEIGHT); y += 1) {
        for (let x = Math.floor(playerX); x < Math.ceil(playerX + PLAYER_WIDTH); x += 1) {
          if (level.terrain[y * level.width + x]) return false;
        }
      }
    }
    for (let x = Math.floor(point.supportX); x < point.supportX + point.supportWidth; x += 1) {
      if (!level.terrain[point.supportY * level.width + x]) return false;
    }
  }
  let requiresJump = false;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const point = points[index];
    const horizontalGap = Math.max(0,
      Math.abs(point.x - previous.x) - (previous.supportWidth + point.supportWidth) / 2);
    const rise = previous.y - point.y;
    if (horizontalGap > 94 || rise > 38.6 || point.y - previous.y > level.height * 0.55) return false;
    if (rise > 3) requiresJump = true;
  }
  if (!requiresJump) return false;
  for (const checkpoint of level.checkpoints) {
    if (!points.some((point) => Math.hypot(point.x - checkpoint.x, point.y - checkpoint.y) <= 7)) {
      return false;
    }
  }
  const expectedEnemyCount = level.combat ? level.enemies.length >= 4 &&
    level.enemies.length <= 8 : level.enemies.length === 3;
  if (!expectedEnemyCount) return false;
  for (const enemy of level.enemies) {
    for (let sample = 0; sample <= 100; sample += 1) {
      const progress = sample / 100;
      const x = lerp(enemy.path[0].x, enemy.path[1].x, progress);
      const y = lerp(enemy.path[0].y, enemy.path[1].y, progress);
      if (x < 8 || x > level.width - 14 || y < 8 || y > level.height - 14) return false;
      for (let cellY = Math.floor(y - 2); cellY <= y + 2; cellY += 1) {
        for (let cellX = Math.floor(x - 2); cellX <= x + 2; cellX += 1) {
          if (cellX >= 0 && cellX < level.width && cellY >= 0 && cellY < level.height &&
              level.terrain[cellY * level.width + cellX]) return false;
        }
      }
    }
  }
  for (const pickup of level.pickups) {
    for (let y = Math.floor(pickup.y); y < Math.ceil(pickup.y + pickup.height); y += 1) {
      for (let x = Math.floor(pickup.x); x < Math.ceil(pickup.x + pickup.width); x += 1) {
        if (x >= 0 && x < level.width && y >= 0 && y < level.height &&
            level.terrain[y * level.width + x]) return false;
      }
    }
  }
  return replayCourse(level);
}

export function replayCourse(level) {
  const points = level.route?.points;
  if (!Array.isArray(points) || points.length < 2) return false;
  const run = createRun(level);
  const columns = level.width - PLAYER_WIDTH + 1;
  const rows = level.height - PLAYER_HEIGHT + 1;
  const cellCount = columns * rows;
  const findPath = (targetX, targetY) => {
    const nearestOpen = (x, y) => {
      for (let radius = 0; radius <= 2; radius += 1) {
        for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
          for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
            const candidateX = x + offsetX;
            const candidateY = y + offsetY;
            if (candidateX >= 0 && candidateX < columns && candidateY >= 0 &&
                candidateY < rows && !collides(run, candidateX, candidateY)) {
              return { x: candidateX, y: candidateY };
            }
          }
        }
      }
      return null;
    };
    const start = nearestOpen(Math.round(run.player.x), Math.round(run.player.y));
    const goal = nearestOpen(Math.round(targetX), Math.round(targetY));
    if (!start || !goal) return null;
    const startIndex = start.y * columns + start.x;
    const goalIndex = goal.y * columns + goal.x;
    const previous = new Int32Array(cellCount).fill(-1);
    const queue = new Int32Array(cellCount);
    let head = 0;
    let tail = 0;
    previous[startIndex] = startIndex;
    queue[tail++] = startIndex;
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    while (head < tail && previous[goalIndex] < 0) {
      const current = queue[head++];
      const x = current % columns;
      const y = Math.floor(current / columns);
      for (const [dx, dy] of directions) {
        const nextX = x + dx;
        const nextY = y + dy;
        if (nextX < 0 || nextX >= columns || nextY < 0 || nextY >= rows) continue;
        const nextIndex = nextY * columns + nextX;
        if (previous[nextIndex] >= 0 || collides(run, nextX, nextY)) continue;
        const fromX = current === startIndex ? run.player.x : x;
        const fromY = current === startIndex ? run.player.y : y;
        let edgeClear = true;
        for (let progress = 0.1; progress < 1; progress += 0.1) {
          if (collides(run, fromX + (nextX - fromX) * progress,
            fromY + (nextY - fromY) * progress)) {
            edgeClear = false;
            break;
          }
        }
        if (!edgeClear) continue;
        previous[nextIndex] = current;
        queue[tail++] = nextIndex;
      }
    }
    if (previous[goalIndex] < 0) return null;
    const path = [];
    for (let cursor = goalIndex; cursor !== startIndex; cursor = previous[cursor]) {
      path.push({ x: cursor % columns, y: Math.floor(cursor / columns) });
    }
    return path.reverse();
  };
  let targetIndex = 1;
  let path = [];
  let pathIndex = 0;
  let replans = 0;
  let stalledFrames = 0;
  let previousPosition = { x: run.player.x, y: run.player.y };
  for (let frame = 0; frame < 36000; frame += 1) {
    if (run.completed) return true;
    if (run.events.some((event) => event.type === "reset") || targetIndex >= points.length) return false;
    if (!path.length || pathIndex >= path.length) {
      const target = points[targetIndex];
      path = findPath(target.x - PLAYER_WIDTH / 2, target.y - PLAYER_HEIGHT);
      pathIndex = 0;
      if (!path) return false;
      if (!path.length) {
        targetIndex += 1;
        replans = 0;
        continue;
      }
    }
    const target = path[pathIndex];
    const deltaX = target.x - run.player.x;
    const deltaY = target.y - run.player.y;
    if (Math.hypot(deltaX, deltaY) <= 3.2) {
      pathIndex += 1;
      if (pathIndex >= path.length) {
        targetIndex += 1;
        path = [];
        replans = 0;
      }
      stalledFrames = 0;
      continue;
    }
    const horizontal = Math.abs(deltaX) > 0.1 ? Math.sign(deltaX) : 0;
    const vertical = run.player.climbing
      ? (Math.abs(deltaY) > 0.001 ? Math.sign(deltaY) : 0)
      : -1;
    stepRun(run, { x: horizontal, y: vertical }, 1 / 240, frame * (1000 / 240));
    if (run.events.some((event) => event.type === "reset")) return false;
    if (Math.hypot(run.player.x - previousPosition.x, run.player.y - previousPosition.y) < 0.001) {
      stalledFrames += 1;
    } else {
      stalledFrames = 0;
      previousPosition = { x: run.player.x, y: run.player.y };
    }
    if (stalledFrames > 60 && replans < 3) {
      replans += 1;
      path = [];
      pathIndex = 0;
      stalledFrames = 0;
      continue;
    }
    if (stalledFrames > 480) {
      return false;
    }
  }
  return false;
}

export function generateSuggestions(image, seed = 0x51f15e) {
  if (!image?.data || !Number.isInteger(image.width) || !Number.isInteger(image.height) ||
      image.width < 3 || image.height < 3 || image.data.length < image.width * image.height * 4) {
    throw new Error("The selected image could not be analyzed. Please select another photo.");
  }
  const edges = findPhotoEdges(image, 128, clamp(Math.round(128 * image.height / image.width), 56, 144));
  if (edges.length < 2) {
    throw new Error("No usable visible edge was found. Please select another photo.");
  }
  const random = createRandom(seed);
  const pairs = shuffled(
    ["jungle", "desert", "underwater"].flatMap((biome) =>
      ["horizontal", "vertical", "balanced"].map((layout) => ({ biome, layout }))
    ),
    random
  );
  const options = [];
  for (const pair of pairs) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const option = makeOption(image, edges, options.length, pair, random, String(seed));
      if (option.route.verified) {
        options.push(option);
        break;
      }
    }
    if (options.length === 3) break;
  }
  if (options.length !== 3) {
    throw new Error("Safe routes could not be verified for this photo. Please choose another one.");
  }
  return options;
}

function isSolid(run, x, y) {
  const gridX = Math.floor(x);
  const gridY = Math.floor(y);
  if (gridX < 0 || gridX >= run.level.width || gridY < 0) return true;
  if (gridY >= run.level.height) return false;
  const offset = gridY * run.level.width + gridX;
  if (run.terrain[offset]) return true;
  return run.platforms?.some((platform) =>
    gridX >= platform.x && gridX < platform.x + platform.width &&
    gridY >= platform.y && gridY < platform.y + platform.height
  ) ?? false;
}

function collides(run, x, y) {
  const player = run.player;
  const left = Math.floor(x + 0.001);
  const right = Math.floor(x + player.width - 0.001);
  const top = Math.floor(y + 0.001);
  const bottom = Math.floor(y + player.height - 0.001);
  for (let cellY = top; cellY <= bottom; cellY += 1) {
    for (let cellX = left; cellX <= right; cellX += 1) {
      if (isSolid(run, cellX, cellY)) return true;
    }
  }
  return false;
}

function onFloor(run) {
  return collides(run, run.player.x, run.player.y + 0.08);
}

function findFloorDistance(run, maxDistance = 3) {
  const player = run.player;
  const foot = player.y + player.height;
  for (let distance = 0.08; distance <= maxDistance; distance += 0.2) {
    const row = Math.floor(foot + distance);
    for (let x = Math.floor(player.x + 0.05); x < player.x + player.width - 0.05; x += 1) {
      if (isSolid(run, x, row)) return distance;
    }
  }
  return Infinity;
}

function findWallDirection(run, maxDistance = 3) {
  const player = run.player;
  for (let distance = 0.08; distance <= maxDistance; distance += 0.2) {
    const left = Math.floor(player.x - distance);
    const right = Math.floor(player.x + player.width - 1 + distance);
    for (let y = Math.floor(player.y + 0.2); y < player.y + player.height - 0.2; y += 1) {
      if (isSolid(run, left, y)) return 1;
      if (isSolid(run, right, y)) return -1;
    }
    if (player.x - distance <= 0) return 1;
    if (player.x + player.width + distance >= run.level.width) return -1;
  }
  return 0;
}

function createPlayer(start) {
  return {
    x: start.x,
    y: start.y,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: false,
    climbing: false,
    doubleJumpAvailable: true,
    floorGrace: null,
    wallGrace: null,
    jumpBufferUntil: 0,
    jumpLockedUntilRelease: false,
    climbLockedUntilRelease: false,
    wallJumpUntil: 0,
    wallJumpDirection: 0,
    wallJumpOrigin: null,
    dustUntil: 0,
    dustDirection: 0,
    speedUntil: 0,
    shootingUntil: 0
  };
}

function initializeRun(run, level, players) {
  const playerIndex = Number.isInteger(run.playerIndex) ? run.playerIndex : 0;
  run.level = level;
  run.players = players.slice();
  run.playerIndex = playerIndex;
  run.player = createPlayer(level.playerStart);
  run.terrain = level.terrain.slice();
  run.checkpoints = level.checkpoints.map((checkpoint) => ({ ...checkpoint, collected: false }));
  run.pickups = level.pickups.map((pickup) => ({ ...pickup, collected: false }));
  run.platforms = level.platforms.map((platform) => ({ ...platform, x: platform.initialX }));
  run.enemies = level.enemies.map((enemy) => ({ ...enemy, defeated: false }));
  run.projectiles = [];
  run.labels = [];
  run.input = emptyInput();
  run.timer = 0;
  run.timerStarted = false;
  run.completed = false;
  run.finishLocked = run.checkpoints.length > 0;
  run.message = "";
  run.lastTimestamp = 0;
  run.enemyTime = 0;
  run.events = [];
  run.player.grounded = onFloor(run);
}

function emptyInput() {
  return { x: 0, y: 0, drill: false, shoot: false, jump: false };
}

export function createRun(level, players = ["Runner One", "Runner Two"]) {
  const run = {};
  initializeRun(run, level, players);
  return run;
}

function startTimer(run) {
  if (!run.timerStarted) run.timerStarted = true;
}

function launch(run, direction, timestampMs, wallJump = false, consumesDouble = false) {
  const player = run.player;
  player.vy = JUMP_VELOCITY;
  player.grounded = false;
  player.climbing = false;
  if (consumesDouble) player.doubleJumpAvailable = false;
  player.floorGrace = null;
  player.wallGrace = null;
  player.jumpBufferUntil = 0;
  if (wallJump) {
    player.vx = direction * NORMAL_SPEED;
    player.wallJumpDirection = direction;
    player.wallJumpUntil = timestampMs + 160;
    player.wallJumpOrigin = { x: player.x, y: player.y };
    player.dustDirection = -direction;
    player.dustUntil = timestampMs + 300;
  }
  startTimer(run);
}

export function pressJump(run, timestampMs = 0) {
  const player = run.player;
  if (player.jumpLockedUntilRelease) return false;
  if (player.climbing) {
    player.climbing = false;
    player.vy = Math.max(1, player.vy);
    player.climbLockedUntilRelease = true;
    player.doubleJumpAvailable = true;
    player.floorGrace = null;
    player.wallGrace = null;
    player.jumpLockedUntilRelease = true;
    startTimer(run);
    return true;
  }
  if (player.grounded || onFloor(run) || findFloorDistance(run) <= 3) {
    launch(run, 0, timestampMs);
    return true;
  }
  const contactWall = findWallDirection(run);
  if (contactWall) {
    launch(run, contactWall, timestampMs, true);
    return true;
  }
  if (player.floorGrace && Math.hypot(player.x - player.floorGrace.x, player.y - player.floorGrace.y) <= 3) {
    launch(run, 0, timestampMs);
    return true;
  }
  if (player.wallGrace && Math.hypot(player.x - player.wallGrace.x, player.y - player.wallGrace.y) <= 4) {
    launch(run, player.wallGrace.direction, timestampMs, true);
    return true;
  }
  if (player.doubleJumpAvailable) {
    launch(run, 0, timestampMs, false, true);
    return true;
  }
  player.jumpBufferUntil = timestampMs + 150;
  return false;
}

function drillDirection(input, player) {
  const x = Math.sign(input.x || 0);
  const y = Math.sign(input.y || 0);
  if (x || y) return { x, y };
  if (player.climbing) return { x: 0, y: -1 };
  return { x: player.facing, y: 0 };
}

function excavate(run, direction) {
  const player = run.player;
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2;
  const anchorX = Math.round(centerX + direction.x * (player.width / 2 + 1));
  const anchorY = Math.round(centerY + direction.y * (player.height / 2 + 1));
  const horizontalWalking = direction.x !== 0 && !player.climbing && player.grounded;
  let changed = false;
  for (let along = -2; along <= 2; along += 1) {
    for (let across = -1; across <= 1; across += 1) {
      const cellX = anchorX + (direction.x ? across : along);
      const cellY = anchorY + (direction.y ? across : along);
      if (cellX < 0 || cellX >= run.level.width || cellY < 0 || cellY >= run.level.height) continue;
      if (horizontalWalking && cellY >= Math.ceil(player.y + player.height - 0.001)) continue;
      const offset = cellY * run.level.width + cellX;
      if (run.terrain[offset] && !run.level.nonDrillable[offset]) {
        run.terrain[offset] = false;
        changed = true;
      }
    }
  }
  return changed;
}

function setPlayerPosition(run, x, y) {
  const player = run.player;
  const oldX = player.x;
  const oldY = player.y;
  const blockedClimbDown = player.climbing && y > oldY && collides(run, player.x, y);
  if (!collides(run, x, player.y)) player.x = x;
  if (!collides(run, player.x, y)) player.y = y;
  if (player.x !== oldX) {
    if (player.grounded) player.floorGrace = { x: oldX, y: oldY };
    player.facing = player.x > oldX ? 1 : -1;
  }
  if (player.y < oldY) {
    if (!player.climbing) player.grounded = false;
  } else if (blockedClimbDown || (player.y > oldY && collides(run, player.x, player.y + 0.08))) {
    player.grounded = true;
    player.vy = 0;
    player.doubleJumpAvailable = true;
    player.climbing = false;
    player.floorGrace = null;
    player.wallGrace = null;
  }
  if ((player.grounded || (!player.climbing && player.vy >= 0)) && findFloorDistance(run) <= 3) {
    player.doubleJumpAvailable = true;
  }
  if (player.wallJumpOrigin &&
      Math.hypot(player.x - player.wallJumpOrigin.x, player.y - player.wallJumpOrigin.y) > 4) {
    player.wallJumpOrigin = null;
  }
  const wallDirection = player.wallJumpOrigin ? 0 : findWallDirection(run);
  if (wallDirection) {
    player.wallGrace = { x: player.x, y: player.y, direction: wallDirection };
    player.doubleJumpAvailable = true;
  }
  if (oldY === player.y && player.grounded && !onFloor(run)) {
    const distance = findFloorDistance(run);
    if (distance <= 3) {
      player.y += distance;
      player.vy = 0;
    } else {
      player.grounded = false;
      player.floorGrace = { x: oldX, y: oldY };
    }
  }
}

function updatePatrols(run, deltaSeconds) {
  run.enemyTime += deltaSeconds;
  for (const enemy of run.enemies) {
    if (enemy.defeated) continue;
    const progress = (Math.sin(run.enemyTime * 0.8 + enemy.phase) + 1) / 2;
    enemy.x = lerp(enemy.path[0].x, enemy.path[1].x, progress);
    enemy.y = lerp(enemy.path[0].y, enemy.path[1].y, progress);
  }
}

function boundsOverlap(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
    a.y < b.y + b.height && a.y + a.height > b.y;
}

function platformPathClear(run, platform, x) {
  for (let y = Math.floor(platform.y); y < platform.y + platform.height; y += 1) {
    for (let cellX = Math.floor(x); cellX < x + platform.width; cellX += 1) {
      if (cellX < 1 || cellX >= run.level.width - 1 || y < 1 || y >= run.level.height - 1 ||
          run.terrain[y * run.level.width + cellX]) return false;
    }
  }
  return true;
}

function resetAfterFailure(run, message) {
  const level = run.level;
  const players = run.players;
  initializeRun(run, level, players);
  run.message = message;
  run.events.push({ type: "reset", message });
}

function collectItems(run, timestampMs) {
  const playerBounds = run.player;
  for (const checkpoint of run.checkpoints) {
    if (!checkpoint.collected && Math.hypot(
      playerBounds.x + playerBounds.width / 2 - checkpoint.x,
      playerBounds.y + playerBounds.height / 2 - checkpoint.y
    ) < 7) {
      checkpoint.collected = true;
      run.events.push({ type: "checkpoint" });
    }
  }
  for (const pickup of run.pickups) {
    if (pickup.collected || !boundsOverlap(playerBounds, pickup)) continue;
    pickup.collected = true;
    if (pickup.type === "speed") {
      run.player.speedUntil = timestampMs + 5000;
      run.events.push({ type: "speed", duration: 5 });
    } else {
      run.timer -= 2;
      run.labels.push({ x: pickup.x, y: pickup.y, startedAt: timestampMs });
      run.events.push({ type: "mushroom", seconds: -2 });
    }
  }
  run.finishLocked = run.checkpoints.some((checkpoint) => !checkpoint.collected);
}

function updateProjectiles(run, deltaSeconds) {
  for (const projectile of run.projectiles) {
    const previousX = projectile.x;
    projectile.x += projectile.direction * 100 * deltaSeconds;
    for (const enemy of run.enemies) {
      if (enemy.defeated) continue;
      const progress = projectile.x === previousX ? 0 :
        clamp((enemy.x - previousX) / (projectile.x - previousX), 0, 1);
      const closestX = previousX + (projectile.x - previousX) * progress;
      if (Math.abs(closestX - enemy.x) < 3 && Math.abs(projectile.y - enemy.y) < 3) {
        enemy.defeated = true;
        projectile.hit = true;
      }
    }
  }
  run.projectiles = run.projectiles.filter((projectile) =>
    !projectile.hit && projectile.x >= 0 && projectile.x < run.level.width
  );
}

export function stepRun(run, input = {}, deltaSeconds = 1 / 60, timestampMs = 0) {
  if (run.completed) return run;
  const dt = clamp(Number(deltaSeconds) || 0, 0, 0.1);
  const normalized = {
    x: clamp(Number(input.x) || 0, -1, 1),
    y: clamp(Number(input.y) || 0, -1, 1),
    drill: Boolean(input.drill),
    shoot: Boolean(input.shoot)
  };
  const wasJumping = Boolean(run.input.jump);
  const wasUp = Number(run.input.y) < -0.5;
  if (!input.jump && wasJumping) playerBufferCancelled(run.player);
  run.input = { ...run.input, ...normalized, jump: Boolean(input.jump) };
  const player = run.player;
  if (input.jump && !wasJumping) pressJump(run, timestampMs);
  if (!input.jump) player.jumpLockedUntilRelease = false;
  if (normalized.y >= 0) player.climbLockedUntilRelease = false;
  if (normalized.y < 0 && !wasUp && !player.climbing && !player.climbLockedUntilRelease && !normalized.drill) {
    player.climbing = true;
    player.vy = 0;
    player.doubleJumpAvailable = true;
    player.floorGrace = null;
    player.wallGrace = null;
  }
  if (!player.climbing && !normalized.drill) normalized.y = 0;
  const magnitude = Math.hypot(normalized.x, normalized.y);
  if (magnitude > 1) {
    normalized.x /= magnitude;
    normalized.y /= magnitude;
  }
  startTimerOnMovement(run, normalized, dt);
  if (run.timerStarted) run.timer += dt;
  if (normalized.x) player.facing = Math.sign(normalized.x);
  if (normalized.shoot && run.level.combat && timestampMs >= player.shootingUntil) {
    run.projectiles.push({
      x: player.x + (player.facing > 0 ? player.width : 0),
      y: player.y + player.height / 2,
      direction: player.facing
    });
    player.shootingUntil = timestampMs + 500;
    player.shooting = true;
  }
  updateProjectiles(run, dt);

  const previousPlayerY = player.y;
  let activelyExcavating = false;
  if (normalized.drill) {
    if (!player.grounded && !player.climbing) player.climbing = true;
    activelyExcavating = excavate(run, drillDirection(normalized, player));
  }
  const speedMultiplier = timestampMs < player.speedUntil ? 2 : 1;
  const speed = activelyExcavating ? ACTIVE_DRILL_SPEED : player.climbing ? CLIMB_SPEED : NORMAL_SPEED;
  const horizontalInput = normalized.x || (timestampMs < player.wallJumpUntil ? player.wallJumpDirection : 0);
  const moveX = horizontalInput * speed * speedMultiplier * dt;
  const moveY = normalized.y * speed * speedMultiplier * dt;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(moveX), Math.abs(moveY)) / 0.35));
  for (let index = 0; index < steps; index += 1) {
    setPlayerPosition(run, player.x + moveX / steps, player.y + moveY / steps);
  }

  if (player.climbing) {
    player.vy = 0;
  } else {
    const verticalDisplacement = player.vy * dt + 0.5 * GRAVITY * dt * dt;
    const verticalSteps = Math.max(1, Math.ceil(Math.abs(verticalDisplacement) / 0.35));
    const verticalStepTime = dt / verticalSteps;
    for (let index = 0; index < verticalSteps; index += 1) {
      const oldY = player.y;
      const stepDisplacement = player.vy * verticalStepTime +
        0.5 * GRAVITY * verticalStepTime * verticalStepTime;
      setPlayerPosition(run, player.x, player.y + stepDisplacement);
      player.vy = Math.min(150, player.vy + GRAVITY * verticalStepTime);
      if (player.y === oldY && stepDisplacement < 0) player.vy = 0;
      if (player.y === oldY && stepDisplacement > 0) {
        player.grounded = true;
        player.doubleJumpAvailable = true;
        player.vy = 0;
        break;
      }
    }
  }

  if (run.timerStarted) {
    for (const platform of run.platforms) {
      if (platform.minX > 2 && platformPathClear(run, platform, platform.minX - 1)) {
        platform.minX -= 1;
      }
      if (platform.maxX < run.level.width - 14 && platformPathClear(run, platform, platform.maxX + 1)) {
        platform.maxX += 1;
      }
      const nextX = platform.x + platform.direction * 18 * dt;
      if (nextX < platform.minX || nextX > platform.maxX) platform.direction *= -1;
      else {
        const delta = nextX - platform.x;
        const riding = Math.abs(player.y + player.height - platform.y) < 0.3 &&
          player.x + player.width > platform.x && player.x < platform.x + platform.width;
        const wouldHitPlayer = !riding &&
          player.x < nextX + platform.width && player.x + player.width > nextX &&
          player.y < platform.y + platform.height && player.y + player.height > platform.y;
        if (wouldHitPlayer) continue;
        if (riding && !collides(run, player.x + delta, player.y) &&
            player.x + delta >= 0 && player.x + delta + player.width <= run.level.width) {
          player.x += delta;
        } else if (riding) {
          continue;
        }
        platform.x = nextX;
      }
    }
  }

  if (player.jumpBufferUntil && timestampMs <= player.jumpBufferUntil && onFloor(run)) {
    launch(run, 0, timestampMs);
  } else if (timestampMs > player.jumpBufferUntil) {
    player.jumpBufferUntil = 0;
  }
  if (player.y + player.height >= run.level.height - 0.01) {
    resetAfterFailure(run, "Back to the start! The bottom of the photo got you.");
    return run;
  }
  if (run.timerStarted) updatePatrols(run, dt);
  collectItems(run, timestampMs);
  const playerRect = {
    x: player.x + 1,
    y: player.y + 1,
    width: player.width - 2,
    height: player.height - 2
  };
  const enemyHit = run.enemies.find((enemy) => !enemy.defeated &&
    boundsOverlap(playerRect, { x: enemy.x, y: enemy.y, width: 5, height: 5 }));
  if (enemyHit && player.vy > 0 && previousPlayerY + player.height <= enemyHit.y + 1) {
    enemyHit.defeated = true;
    player.vy = JUMP_VELOCITY * 0.62;
    player.doubleJumpAvailable = true;
    run.events.push({ type: "stomp" });
  } else if (enemyHit) {
    resetAfterFailure(run, "A patrol tagged you. Fresh run!");
    return run;
  }
  const checkpointsComplete = run.checkpoints.every((checkpoint) => checkpoint.collected);
  if (checkpointsComplete && boundsOverlap(playerRect, run.level.finish)) {
    run.completed = true;
    run.events.push({ type: "finish", time: run.timer });
  }
  return run;
}

function startTimerOnMovement(run, input, deltaSeconds) {
  if (deltaSeconds && (Math.abs(input.x) > 0 || Math.abs(input.y) > 0 || input.drill || input.shoot)) {
    startTimer(run);
  }
}

function playerBufferCancelled(player) {
  player.jumpBufferUntil = 0;
}

export function resetRun(run) {
  initializeRun(run, run.level, run.players);
  return run;
}

export function getLeaderboardRows(entries, currentAttemptId) {
  const ordered = entries
    .map((entry, order) => ({ ...entry, order }))
    .sort((a, b) => a.time - b.time || a.order - b.order);
  const ranked = ordered.slice(0, 10).map((entry, index) => ({
    id: entry.id,
    name: entry.name,
    time: entry.time,
    rank: index + 1
  }));
  const currentEntry = ordered.find((entry) => entry.id === currentAttemptId);
  let current = null;
  if (currentEntry) {
    const rankedEntry = ranked.find((entry) => entry.id === currentAttemptId);
    current = rankedEntry
      ? { ...rankedEntry }
      : { id: currentEntry.id, name: currentEntry.name, time: currentEntry.time, rank: null };
  }
  return { ranked, current };
}

export function makeLevelKey(photoHash, option) {
  const fingerprint = hashText(JSON.stringify({
    id: option.id,
    biome: option.biome,
    layout: option.layout,
    width: option.width,
    height: option.height,
    start: option.playerStart,
    finish: option.finish,
    terrain: option.terrain
  }));
  return `${photoHash}:${fingerprint}`;
}

export function getEngineConstants() {
  return {
    cellSize: CELL_SIZE,
    playerWidth: PLAYER_WIDTH,
    playerHeight: PLAYER_HEIGHT,
    normalSpeed: NORMAL_SPEED,
    climbSpeed: CLIMB_SPEED,
    activeDrillSpeed: ACTIVE_DRILL_SPEED,
    jumpHeight: 38.6
  };
}
