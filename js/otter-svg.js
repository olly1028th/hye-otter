/**
 * 혜달이 캐릭터 모듈 (실사 해달 사진 + 상태별 이펙트 오버레이)
 * 실제 해달 이미지를 기반으로, 상태에 따라 이모지/이펙트가 오버레이됩니다.
 */
const OtterSVG = (() => {
  // 실사 해달 이미지 (Stitch AI 생성 이미지)
  const OTTER_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-oHQ_QN3TU94PgJQ7th41ObzSjeoNYtWNzGF4ZIZH_uCQQJeflNmFX_KYnt01hzyA9MlyPtq44_TPynD_DC5L-zlI0OaAL9ZotNOxfdwuq6aqg_CR5tz8afZKTZ_j-_euZr7O5-lrqgaBu_XlhaEJf5rg50YpCnbTDNz3YPfddQbrE3Tk1nRZHhBVVD7OIS1zPLJzIItNepnbXzd4jav6bpAAdr3VpjlfEsSOCjp83ls6DNkDzJZX5h-1T30wwcbULaAtAa2a4k4';

  // ===== 상태별 이펙트 오버레이 (사진 위에 표시) =====
  const faces = {
    default: `
      <!-- 기본: 깨끗한 상태, 오버레이 없음 -->
    `,
    happy: `
      <!-- 행복: 스파클 + 볼터치 -->
      <circle cx="85" cy="165" r="18" fill="#FFB5B5" opacity="0.25"/>
      <circle cx="215" cy="165" r="18" fill="#FFB5B5" opacity="0.25"/>
      <text x="40" y="55" font-size="22">✨</text>
      <text x="235" y="65" font-size="18">💫</text>
    `,
    focused: `
      <!-- 집중: 불꽃 + 집중선 -->
      <text x="235" y="55" font-size="28">🔥</text>
      <line x1="30" y1="80" x2="55" y2="95" stroke="#FF6B35" stroke-width="2" opacity="0.3" stroke-linecap="round"/>
      <line x1="245" y1="80" x2="270" y2="65" stroke="#FF6B35" stroke-width="2" opacity="0.3" stroke-linecap="round"/>
      <line x1="25" y1="110" x2="50" y2="110" stroke="#FF6B35" stroke-width="2" opacity="0.2" stroke-linecap="round"/>
    `,
    tired: `
      <!-- 졸림: Zzz + 어두운 톤 -->
      <rect x="0" y="0" width="300" height="300" rx="150" fill="#1e293b" opacity="0.08"/>
      <text x="220" y="50" font-size="22" fill="#6B7FD7" font-weight="bold" opacity="0.8">Z</text>
      <text x="240" y="32" font-size="16" fill="#6B7FD7" font-weight="bold" opacity="0.6">z</text>
      <text x="252" y="18" font-size="12" fill="#6B7FD7" font-weight="bold" opacity="0.4">z</text>
      <text x="38" y="60" font-size="18">😴</text>
    `,
    sad: `
      <!-- 슬픔: 비구름 + 눈물 -->
      <g opacity="0.5">
        <ellipse cx="150" cy="22" rx="55" ry="18" fill="#94A3B8"/>
        <ellipse cx="120" cy="18" rx="35" ry="15" fill="#94A3B8"/>
        <ellipse cx="185" cy="16" rx="38" ry="16" fill="#94A3B8"/>
      </g>
      <line x1="125" y1="38" x2="122" y2="58" stroke="#5BC0EB" stroke-width="2" opacity="0.4">
        <animate attributeName="y2" values="58;68;58" dur="1s" repeatCount="indefinite"/>
      </line>
      <line x1="150" y1="40" x2="148" y2="62" stroke="#5BC0EB" stroke-width="2" opacity="0.3">
        <animate attributeName="y2" values="62;72;62" dur="1.3s" repeatCount="indefinite"/>
      </line>
      <line x1="175" y1="36" x2="173" y2="56" stroke="#5BC0EB" stroke-width="2" opacity="0.35">
        <animate attributeName="y2" values="56;66;56" dur="0.9s" repeatCount="indefinite"/>
      </line>
      <text x="255" y="50" font-size="16">😢</text>
    `,
    excited: `
      <!-- 신남: 별 + 스파클 폭발 -->
      <text x="30" y="45" font-size="20">🎉</text>
      <text x="240" y="50" font-size="18">⭐</text>
      <text x="50" y="260" font-size="14">✨</text>
      <text x="230" y="255" font-size="16">✨</text>
      <text x="140" y="20" font-size="14">🌟</text>
      <circle cx="80" cy="165" r="20" fill="#FFB5B5" opacity="0.3"/>
      <circle cx="220" cy="165" r="20" fill="#FFB5B5" opacity="0.3"/>
    `,
    stressed: `
      <!-- 힘듦: 땀 + 소용돌이 -->
      <text x="240" y="50" font-size="18">😰</text>
      <path d="M55 60 Q52 75 55 85" stroke="#5BC0EB" stroke-width="2.5" fill="none" opacity="0.5">
        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="1.5s" repeatCount="indefinite"/>
      </path>
      <path d="M250 80 Q247 92 250 100" stroke="#5BC0EB" stroke-width="2" fill="none" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.15;0.4" dur="1.8s" repeatCount="indefinite"/>
      </path>
      <text x="35" y="55" font-size="12">💦</text>
    `,
    loved: `
      <!-- 사랑: 하트 + 볼터치 + 반짝 -->
      <circle cx="85" cy="165" r="22" fill="#FFB5B5" opacity="0.35"/>
      <circle cx="215" cy="165" r="22" fill="#FFB5B5" opacity="0.35"/>
      <text x="35" y="45" font-size="18" opacity="0.8">💕</text>
      <text x="240" y="40" font-size="14" opacity="0.6">💗</text>
      <text x="130" y="18" font-size="16" opacity="0.7">❤️</text>
      <text x="60" y="265" font-size="12" opacity="0.5">💖</text>
      <text x="220" y="270" font-size="14" opacity="0.4">💕</text>
    `,
    hungry: `
      <!-- 배고픔: 조개 + 침 + 배꼬르륵 -->
      <text x="240" y="90" font-size="26">🐚</text>
      <text x="260" y="105" font-size="10" fill="#94A3B8">?</text>
      <path d="M190 210 Q195 225 192 235" stroke="#5BC0EB" stroke-width="2" fill="none" opacity="0.4" stroke-linecap="round">
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite"/>
      </path>
      <!-- 배 꼬르륵 -->
      <g opacity="0.3">
        <path d="M120 230 Q130 225 140 230 Q150 235 160 230" stroke="#D4A04A" stroke-width="1.5" fill="none" stroke-linecap="round">
          <animate attributeName="d" values="M120 230 Q130 225 140 230 Q150 235 160 230;M120 233 Q130 228 140 233 Q150 238 160 233;M120 230 Q130 225 140 230 Q150 235 160 230" dur="1.5s" repeatCount="indefinite"/>
        </path>
      </g>
    `,
    eating: `
      <!-- 먹는 중: 물고기 + 행복 볼터치 -->
      <circle cx="85" cy="165" r="18" fill="#FFB5B5" opacity="0.3"/>
      <circle cx="215" cy="165" r="18" fill="#FFB5B5" opacity="0.3"/>
      <text x="235" y="200" font-size="24">🐟</text>
      <text x="40" y="55" font-size="14">✨</text>
      <text x="245" y="60" font-size="12">⭐</text>
    `,
    playing: `
      <!-- 놀기: 공 + 스파클 -->
      <text x="240" y="250" font-size="26">⚽</text>
      <circle cx="85" cy="165" r="16" fill="#FFB5B5" opacity="0.25"/>
      <circle cx="215" cy="165" r="16" fill="#FFB5B5" opacity="0.25"/>
      <text x="40" y="50" font-size="16">🎾</text>
      <text x="35" y="260" font-size="12">✨</text>
    `,
    sleeping: `
      <!-- 잠자기: 어두운 톤 + ZZZ -->
      <rect x="0" y="0" width="300" height="300" rx="150" fill="#1e293b" opacity="0.12"/>
      <text x="215" y="45" font-size="24" fill="#6B7FD7" font-weight="bold" opacity="0.8">Z</text>
      <text x="238" y="25" font-size="18" fill="#6B7FD7" font-weight="bold" opacity="0.6">Z</text>
      <text x="255" y="10" font-size="13" fill="#6B7FD7" font-weight="bold" opacity="0.4">Z</text>
      <circle cx="85" cy="165" r="15" fill="#FFB5B5" opacity="0.15"/>
      <circle cx="215" cy="165" r="15" fill="#FFB5B5" opacity="0.15"/>
    `,
    bored: `
      <!-- 심심: 물음표 + 약간 어두움 -->
      <rect x="0" y="0" width="300" height="300" rx="150" fill="#1e293b" opacity="0.04"/>
      <text x="235" y="55" font-size="24" fill="#94A3B8" opacity="0.6">?</text>
      <text x="45" y="265" font-size="12" opacity="0.3">💤</text>
    `,
    levelup: `
      <!-- 레벨업: 축하 이펙트 폭발 -->
      <text x="30" y="40" font-size="22">🎉</text>
      <text x="235" y="35" font-size="24">🎊</text>
      <text x="130" y="15" font-size="18">✨</text>
      <text x="55" y="270" font-size="14">⭐</text>
      <text x="225" y="265" font-size="16">🌟</text>
      <circle cx="85" cy="165" r="22" fill="#FFD700" opacity="0.25"/>
      <circle cx="215" cy="165" r="22" fill="#FFD700" opacity="0.25"/>
      <!-- 골든 오라 -->
      <circle cx="150" cy="150" r="140" fill="none" stroke="#FFD700" stroke-width="3" opacity="0.2">
        <animate attributeName="r" values="140;148;140" dur="1.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.2;0.1;0.2" dur="1.5s" repeatCount="indefinite"/>
      </circle>
    `
  };

  // ===== 스탯 기반 비주얼 오버레이 생성 =====
  function buildStatOverlays(stats) {
    if (!stats) return '';
    let svg = '';
    const { fullness = 50, cleanliness = 50, happiness = 50 } = stats;

    // --- 배고픔 오버레이 (포만감 낮을 때, 표정이 hungry가 아닌 경우 보조) ---
    if (fullness < 30 && fullness > 0) {
      const intensity = fullness < 15 ? 0.6 : 0.3;
      svg += `
        <g opacity="${intensity}">
          <path d="M120 235 Q130 230 140 235 Q150 240 160 235" stroke="#D4A04A" stroke-width="1.5" fill="none" stroke-linecap="round">
            <animate attributeName="d" values="M120 235 Q130 230 140 235 Q150 240 160 235;M120 238 Q130 233 140 238 Q150 243 160 238;M120 235 Q130 230 140 235 Q150 240 160 235" dur="1.5s" repeatCount="indefinite"/>
          </path>
        </g>
      `;
    }

    // --- 더러움 오버레이 (청결도 낮을 때) ---
    if (cleanliness < 30 && cleanliness > 0) {
      const intensity = cleanliness < 15 ? 0.5 : 0.25;
      svg += `
        <g opacity="${intensity}">
          <circle cx="75" cy="190" r="4" fill="#8B7355"/>
          <circle cx="90" cy="215" r="3" fill="#8B7355"/>
          <circle cx="215" cy="195" r="3.5" fill="#8B7355"/>
          <circle cx="205" cy="220" r="2.5" fill="#8B7355"/>
        </g>
      `;
      if (cleanliness < 15) {
        svg += `<text x="250" y="75" font-size="12" opacity="0.4">💦</text>`;
      }
    }

    // --- 행복 오버레이 (높을 때 보너스 스파클) ---
    if (happiness > 85) {
      svg += `
        <text x="25" y="120" font-size="10" opacity="0.35">✨</text>
        <text x="262" y="130" font-size="8" opacity="0.3">⭐</text>
      `;
    }

    // --- 최고 상태: 골든 오라 ---
    if (fullness > 80 && cleanliness > 80 && happiness > 80) {
      svg += `
        <circle cx="150" cy="150" r="142" fill="none" stroke="#FFD700" stroke-width="2" opacity="0.12">
          <animate attributeName="r" values="142;148;142" dur="2.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.12;0.06;0.12" dur="2.5s" repeatCount="indefinite"/>
        </circle>
      `;
    }

    // --- 위급 상태: 빨간 경고 ---
    if (fullness < 20 && cleanliness < 20 && happiness < 20) {
      svg += `
        <circle cx="150" cy="150" r="145" fill="none" stroke="#EF4444" stroke-width="2" opacity="0">
          <animate attributeName="opacity" values="0;0.25;0" dur="1.5s" repeatCount="indefinite"/>
        </circle>
      `;
    }

    return svg;
  }

  /**
   * 상태에 맞는 SVG 생성 (실사 해달 사진 + 이펙트 오버레이)
   */
  function render(state = 'default', stats = null) {
    const face = faces[state] || faces.default;
    const overlays = buildStatOverlays(stats);
    return `
      <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" class="otter-svg">
        <defs>
          <clipPath id="otter-clip">
            <circle cx="150" cy="150" r="145"/>
          </clipPath>
        </defs>
        <!-- 실사 해달 이미지 -->
        <image href="${OTTER_IMG}" x="0" y="0" width="300" height="300"
               clip-path="url(#otter-clip)" preserveAspectRatio="xMidYMid slice"/>
        <!-- 상태별 이펙트 오버레이 -->
        ${face}
        <!-- 스탯 기반 오버레이 -->
        ${overlays}
      </svg>
    `;
  }

  /**
   * 컨테이너에 혜달이를 렌더링
   */
  function mount(containerId, state, stats) {
    const el = document.getElementById(containerId);
    if (!el) return;

    el.innerHTML = render(state, stats);

    // 웰니스 레벨 data attribute 설정 (CSS 효과용)
    if (stats) {
      const wellness = (stats.fullness || 0) * 0.3 + (stats.cleanliness || 0) * 0.25 + (stats.happiness || 0) * 0.45;
      if (wellness > 85) el.dataset.wellness = 'max';
      else if (wellness > 60) el.dataset.wellness = 'high';
      else if (wellness > 35) el.dataset.wellness = 'medium';
      else if (wellness > 15) el.dataset.wellness = 'low';
      else el.dataset.wellness = 'critical';
    }
  }

  return { render, mount, faces };
})();
