/* global React, VHS */
const { useState, useEffect, useRef, useCallback, useMemo } = React;

/* ─────────── Layer rendering + interaction ─────────── */
function Layer({ layer, selected, onSelect, onChange, onCommit, scale, editing, onStartEdit, onEndEdit }) {
  const elRef = useRef(null);
  const editRef = useRef(null);

  /* Drag / resize / rotate */
  const drag = useRef(null);

  const onPointerDown = (e, mode, handle) => {
    if (editing) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect(layer.id);
    e.target.setPointerCapture?.(e.pointerId);
    drag.current = {
      mode, handle,
      startX: e.clientX, startY: e.clientY,
      orig: { ...layer },
    };
  };

  const onPointerMove = (e) => {
    if (!drag.current) return;
    e.preventDefault();
    const { mode, handle, startX, startY, orig } = drag.current;
    const dx = (e.clientX - startX) / scale;
    const dy = (e.clientY - startY) / scale;

    if (mode === 'move') {
      onChange({ x: orig.x + dx, y: orig.y + dy });
    } else if (mode === 'resize') {
      let { x, y, w, h } = orig;
      const minW = 30, minH = 20;
      if (handle.includes('e')) w = Math.max(minW, orig.w + dx);
      if (handle.includes('s')) h = Math.max(minH, orig.h + dy);
      if (handle.includes('w')) { w = Math.max(minW, orig.w - dx); x = orig.x + (orig.w - w); }
      if (handle.includes('n')) { h = Math.max(minH, orig.h - dy); y = orig.y + (orig.h - h); }
      // For text layers, keep size proportional and scale font
      if (layer.kind === 'text' && handle.includes('e') && handle.includes('s')) {
        const ratio = w / orig.w;
        onChange({ x, y, w, h, size: Math.max(8, Math.round(orig.size * ratio)) });
      } else {
        onChange({ x, y, w, h });
      }
    } else if (mode === 'rotate') {
      const cx = orig.x + orig.w / 2;
      const cy = orig.y + orig.h / 2;
      // We need pointer pos in sleeve coords; use stage-relative
      const stageRect = drag.current.stageRect;
      if (stageRect) {
        const px = (e.clientX - stageRect.left) / scale;
        const py = (e.clientY - stageRect.top) / scale;
        const angle = Math.atan2(py - cy, px - cx) * 180 / Math.PI + 90;
        onChange({ rotation: Math.round(angle) });
      }
    }
  };

  const onPointerUp = (e) => {
    if (!drag.current) return;
    e.target.releasePointerCapture?.(e.pointerId);
    drag.current = null;
    onCommit?.();
  };

  /* Handle rotate-start: capture stage rect for math */
  const onRotateDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(layer.id);
    e.target.setPointerCapture?.(e.pointerId);
    const stage = elRef.current?.closest('.sleeve');
    drag.current = {
      mode: 'rotate', handle: 'rot',
      startX: e.clientX, startY: e.clientY,
      orig: { ...layer },
      stageRect: stage?.getBoundingClientRect(),
    };
  };

  /* Auto-focus inline editor on open */
  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
      editRef.current.select?.();
    }
  }, [editing]);

  const style = {
    left: layer.x, top: layer.y,
    width: layer.w, height: layer.h,
    transform: layer.rotation ? `rotate(${layer.rotation}deg)` : undefined,
    opacity: layer.opacity ?? 1,
  };

  if (layer.kind === 'image') {
    const isPlaceholder = layer.src === '__poster_placeholder';
    return (
      <div
        ref={elRef}
        className="layer layer--image"
        data-selected={selected}
        style={{
          ...style,
          backgroundImage: isPlaceholder ? 'none' : `url("${layer.src}")`,
          background: isPlaceholder ? layer.placeholderBg || 'repeating-linear-gradient(45deg, #888, #888 10px, #999 10px, #999 20px)' : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        onPointerDown={(e) => onPointerDown(e, 'move')}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {isPlaceholder && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 14, letterSpacing: 3, fontFamily: 'VT323, monospace',
            textTransform: 'uppercase',
            background: layer.placeholderBg || 'repeating-linear-gradient(45deg, #555 0 12px, #444 12px 24px)',
            textShadow: '0 1px 2px #000a',
          }}>
            ⏏ Cliquez pour importer une affiche
          </div>
        )}
        <Handles onDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onRotateDown={onRotateDown} selected={selected} />
      </div>
    );
  }

  if (layer.kind === 'text') {
    const textStyle = {
      ...style,
      fontFamily: layer.font,
      fontWeight: layer.weight,
      fontStyle: layer.italic ? 'italic' : 'normal',
      fontSize: layer.size,
      color: layer.color,
      textAlign: layer.align,
      letterSpacing: layer.letterSpacing,
      lineHeight: layer.lineHeight ?? 1,
      textShadow: layer.shadow || 'none',
    };
    return (
      <div
        ref={elRef}
        className="layer layer--text"
        data-selected={selected}
        style={textStyle}
        onPointerDown={(e) => onPointerDown(e, 'move')}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={(e) => { e.stopPropagation(); onStartEdit(layer.id); }}
      >
        {editing ? (
          <textarea
            ref={editRef}
            className="layer-edit"
            value={layer.text}
            onChange={(e) => onChange({ text: e.target.value })}
            onBlur={() => { onEndEdit(); onCommit?.(); }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { e.preventDefault(); onEndEdit(); }
            }}
            style={textStyle}
            onPointerDown={(e) => e.stopPropagation()}
          />
        ) : (
          <span>{layer.text}</span>
        )}
        <Handles onDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onRotateDown={onRotateDown} selected={selected} />
      </div>
    );
  }

  if (layer.kind === 'shape') {
    const sStyle = {
      ...style,
      background: layer.shapeKind === 'rect' ? layer.color : undefined,
      borderRadius: layer.shapeKind === 'circle' ? '50%' : 0,
    };
    if (layer.shapeKind === 'line') {
      sStyle.background = layer.color;
      sStyle.height = Math.max(2, layer.h);
    }
    return (
      <div
        ref={elRef}
        className="layer layer--shape"
        data-selected={selected}
        style={sStyle}
        onPointerDown={(e) => onPointerDown(e, 'move')}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <Handles onDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onRotateDown={onRotateDown} selected={selected} />
      </div>
    );
  }
  return null;
}

function Handles({ onDown, onPointerMove, onPointerUp, onRotateDown, selected }) {
  if (!selected) return null;
  const mk = (h) => (
    <div
      key={h}
      className={`layer__handle layer__handle--${h}`}
      onPointerDown={(e) => onDown(e, 'resize', h)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    />
  );
  return (
    <>
      {['nw', 'ne', 'sw', 'se'].map(mk)}
      <div className="layer__rotate" onPointerDown={onRotateDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />
    </>
  );
}

/* ─────────── Floating per-layer toolbar ─────────── */
function LayerToolbar({ layer, onChange, onDelete, onDuplicate, onForward, onBackward, scale, sleeveRect }) {
  if (!layer) return null;
  const top = layer.y * scale - 44;
  const left = layer.x * scale;
  const isText = layer.kind === 'text';

  return (
    <div className="layer-toolbar" style={{ top: Math.max(4, top), left: Math.max(4, left) }} onPointerDown={(e) => e.stopPropagation()}>
      {isText && (
        <>
          <select value={layer.font} onChange={(e) => onChange({ font: e.target.value })} title="Police">
            <option value="'SF Movie Poster Cond', sans-serif">SF Poster Cond</option>
            <option value="'SF Movie Poster', sans-serif">SF Movie Poster</option>
            <option value="'Bee Two', cursive">Bee Two</option>
            <option value="'VT323', monospace">VT323</option>
            <option value="'Bungee Shade', sans-serif">Bungee Shade</option>
            <option value="'Press Start 2P', monospace">Press Start</option>
            <option value="'Monoton', sans-serif">Monoton</option>
            <option value="'Audiowide', sans-serif">Audiowide</option>
          </select>
          <button title="Gras" onClick={() => onChange({ weight: layer.weight === 700 ? 400 : 700 })}><b>B</b></button>
          <button title="Italique" onClick={() => onChange({ italic: !layer.italic })}><i>I</i></button>
          <input type="color" value={layer.color || '#000000'} onChange={(e) => onChange({ color: e.target.value })} title="Couleur" />
          <button title="Aligner gauche" onClick={() => onChange({ align: 'left' })}>⇤</button>
          <button title="Centrer" onClick={() => onChange({ align: 'center' })}>≡</button>
          <button title="Aligner droite" onClick={() => onChange({ align: 'right' })}>⇥</button>
          <span className="sep" />
        </>
      )}
      <button title="Avancer" onClick={onForward}>▲</button>
      <button title="Reculer" onClick={onBackward}>▼</button>
      <button title="Dupliquer" onClick={onDuplicate}>⎘</button>
      <span className="sep" />
      <button title="Supprimer" onClick={onDelete} style={{ color: '#ff5577' }}>✕</button>
    </div>
  );
}

window.VHSLayer = Layer;
window.VHSLayerToolbar = LayerToolbar;
