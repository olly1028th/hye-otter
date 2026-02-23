/**
 * 혜달이 SVG 캐릭터 모듈
 * 상태에 따라 다른 표정과 포즈를 보여줍니다.
 * 스탯 수치에 따라 시각적 오버레이가 추가됩니다.
 */
const OtterSVG = (() => {
  // 기본 몸체 (공통)
  const body = `
    <!-- 꼬리 -->
    <ellipse cx="68" cy="230" rx="18" ry="8" fill="#8B6914" transform="rotate(-30 68 230)"/>
    <!-- 몸 -->
    <ellipse cx="150" cy="195" rx="62" ry="75" fill="#A0783C"/>
    <!-- 배 -->
    <ellipse cx="150" cy="210" rx="42" ry="52" fill="#D4B87A"/>
    <!-- 왼팔 -->
    <path d="M95 175 Q70 195 80 225" stroke="#8B6914" stroke-width="14" fill="none" stroke-linecap="round"/>
    <!-- 오른팔 -->
    <path d="M205 175 Q230 195 220 225" stroke="#8B6914" stroke-width="14" fill="none" stroke-linecap="round"/>
    <!-- 왼발 -->
    <ellipse cx="120" cy="268" rx="18" ry="8" fill="#8B6914"/>
    <!-- 오른발 -->
    <ellipse cx="180" cy="268" rx="18" ry="8" fill="#8B6914"/>
  `;

  // 기본 머리 (공통)
  const head = `
    <!-- 머리 -->
    <circle cx="150" cy="105" r="55" fill="#A0783C"/>
    <!-- 얼굴 안쪽 -->
    <circle cx="150" cy="112" r="40" fill="#D4B87A"/>
    <!-- 왼쪽 귀 -->
    <circle cx="108" cy="65" r="12" fill="#8B6914"/>
    <circle cx="108" cy="65" r="7" fill="#D4B87A"/>
    <!-- 오른쪽 귀 -->
    <circle cx="192" cy="65" r="12" fill="#8B6914"/>
    <circle cx="192" cy="65" r="7" fill="#D4B87A"/>
    <!-- 코 -->
    <ellipse cx="150" cy="118" rx="8" ry="5" fill="#4A3520"/>
  `;

  // 상태별 얼굴 표정
  const faces = {
    default: `
      <!-- 눈 -->
      <circle cx="132" cy="100" r="5" fill="#2C1810"/>
      <circle cx="168" cy="100" r="5" fill="#2C1810"/>
      <circle cx="134" cy="98" r="2" fill="#FFF"/>
      <circle cx="170" cy="98" r="2" fill="#FFF"/>
      <!-- 입 -->
      <path d="M140 128 Q150 136 160 128" stroke="#4A3520" stroke-width="2" fill="none" stroke-linecap="round"/>
    `,
    happy: `
      <!-- 눈 (웃는) -->
      <path d="M126 100 Q132 93 138 100" stroke="#2C1810" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M162 100 Q168 93 174 100" stroke="#2C1810" stroke-width="3" fill="none" stroke-linecap="round"/>
      <!-- 볼터치 -->
      <circle cx="120" cy="115" r="8" fill="#FFB5B5" opacity="0.5"/>
      <circle cx="180" cy="115" r="8" fill="#FFB5B5" opacity="0.5"/>
      <!-- 입 (활짝) -->
      <path d="M136 126 Q150 142 164 126" stroke="#4A3520" stroke-width="2" fill="#FF8B8B" stroke-linecap="round"/>
    `,
    focused: `
      <!-- 눈 (집중) -->
      <circle cx="132" cy="100" r="6" fill="#2C1810"/>
      <circle cx="168" cy="100" r="6" fill="#2C1810"/>
      <circle cx="134" cy="97" r="2.5" fill="#FFF"/>
      <circle cx="170" cy="97" r="2.5" fill="#FFF"/>
      <!-- 눈썹 -->
      <path d="M124 90 L140 88" stroke="#4A3520" stroke-width="2" stroke-linecap="round"/>
      <path d="M160 88 L176 90" stroke="#4A3520" stroke-width="2" stroke-linecap="round"/>
      <!-- 입 (일자) -->
      <line x1="140" y1="128" x2="160" y2="128" stroke="#4A3520" stroke-width="2" stroke-linecap="round"/>
      <!-- 불꽃 이펙트 -->
      <text x="195" y="80" font-size="20">🔥</text>
    `,
    tired: `
      <!-- 눈 (졸린) -->
      <path d="M126 102 Q132 99 138 102" stroke="#2C1810" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M162 102 Q168 99 174 102" stroke="#2C1810" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <!-- 입 (하품) -->
      <ellipse cx="150" cy="130" rx="7" ry="9" fill="#4A3520"/>
      <!-- Zzz -->
      <text x="190" y="70" font-size="14" fill="#6B7FD7" opacity="0.8" font-weight="bold">Z</text>
      <text x="200" y="55" font-size="11" fill="#6B7FD7" opacity="0.6" font-weight="bold">z</text>
      <text x="208" y="43" font-size="9" fill="#6B7FD7" opacity="0.4" font-weight="bold">z</text>
    `,
    sad: `
      <!-- 눈 (슬픈) -->
      <circle cx="132" cy="102" r="5" fill="#2C1810"/>
      <circle cx="168" cy="102" r="5" fill="#2C1810"/>
      <circle cx="133" cy="100" r="2" fill="#FFF"/>
      <circle cx="169" cy="100" r="2" fill="#FFF"/>
      <!-- 눈물 -->
      <path d="M138 106 Q139 114 137 118" stroke="#5BC0EB" stroke-width="2" fill="none" stroke-linecap="round"/>
      <!-- 눈썹 (슬픈) -->
      <path d="M124 93 Q132 89 140 92" stroke="#4A3520" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M160 92 Q168 89 176 93" stroke="#4A3520" stroke-width="2" fill="none" stroke-linecap="round"/>
      <!-- 입 -->
      <path d="M140 132 Q150 125 160 132" stroke="#4A3520" stroke-width="2" fill="none" stroke-linecap="round"/>
    `,
    excited: `
      <!-- 눈 (반짝) -->
      <circle cx="132" cy="100" r="7" fill="#2C1810"/>
      <circle cx="168" cy="100" r="7" fill="#2C1810"/>
      <circle cx="134" cy="97" r="3" fill="#FFF"/>
      <circle cx="170" cy="97" r="3" fill="#FFF"/>
      <circle cx="130" cy="102" r="1.5" fill="#FFF"/>
      <circle cx="166" cy="102" r="1.5" fill="#FFF"/>
      <!-- 볼터치 -->
      <circle cx="118" cy="115" r="9" fill="#FFB5B5" opacity="0.6"/>
      <circle cx="182" cy="115" r="9" fill="#FFB5B5" opacity="0.6"/>
      <!-- 입 -->
      <path d="M134 126 Q150 146 166 126" stroke="#4A3520" stroke-width="2" fill="#FF8B8B" stroke-linecap="round"/>
      <!-- 별 이펙트 -->
      <text x="95" y="70" font-size="14">✨</text>
      <text x="195" y="75" font-size="12">⭐</text>
    `,
    stressed: `
      <!-- 눈 (힘든) -->
      <path d="M126 97 L138 103" stroke="#2C1810" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M138 97 L126 103" stroke="#2C1810" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M162 97 L174 103" stroke="#2C1810" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M174 97 L162 103" stroke="#2C1810" stroke-width="2.5" stroke-linecap="round"/>
      <!-- 땀 -->
      <path d="M105 85 Q103 95 105 100" stroke="#5BC0EB" stroke-width="2" fill="none"/>
      <!-- 입 -->
      <path d="M139 130 Q150 124 161 130" stroke="#4A3520" stroke-width="2" fill="none" stroke-linecap="round"/>
    `,
    loved: `
      <!-- 눈 (하트) -->
      <text x="122" y="107" font-size="16">❤️</text>
      <text x="158" y="107" font-size="16">❤️</text>
      <!-- 볼터치 -->
      <circle cx="118" cy="118" r="10" fill="#FFB5B5" opacity="0.6"/>
      <circle cx="182" cy="118" r="10" fill="#FFB5B5" opacity="0.6"/>
      <!-- 입 -->
      <path d="M138 128 Q150 140 162 128" stroke="#4A3520" stroke-width="2" fill="#FF8B8B" stroke-linecap="round"/>
      <!-- 하트 이펙트 -->
      <text x="90" y="60" font-size="12" opacity="0.7">💕</text>
      <text x="198" y="55" font-size="10" opacity="0.5">💗</text>
    `,
    hungry: `
      <!-- 눈 (기대) -->
      <circle cx="132" cy="100" r="6" fill="#2C1810"/>
      <circle cx="168" cy="100" r="6" fill="#2C1810"/>
      <circle cx="134" cy="97" r="2.5" fill="#FFF"/>
      <circle cx="170" cy="97" r="2.5" fill="#FFF"/>
      <!-- 입 (침 흘리는) -->
      <ellipse cx="150" cy="130" rx="8" ry="6" fill="#4A3520"/>
      <path d="M158 132 Q160 142 157 148" stroke="#5BC0EB" stroke-width="2" fill="none" stroke-linecap="round"/>
    `,
    eating: `
      <!-- 눈 (먹는 중) -->
      <path d="M126 100 Q132 93 138 100" stroke="#2C1810" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M162 100 Q168 93 174 100" stroke="#2C1810" stroke-width="3" fill="none" stroke-linecap="round"/>
      <!-- 볼터치 -->
      <circle cx="118" cy="115" r="9" fill="#FFB5B5" opacity="0.5"/>
      <circle cx="182" cy="115" r="9" fill="#FFB5B5" opacity="0.5"/>
      <!-- 입 (우물우물) -->
      <ellipse cx="150" cy="128" rx="10" ry="7" fill="#4A3520"/>
      <!-- 물고기 -->
      <text x="200" y="160" font-size="18">🐟</text>
    `,
    playing: `
      <!-- 눈 (신난) -->
      <circle cx="132" cy="98" r="6" fill="#2C1810"/>
      <circle cx="168" cy="98" r="6" fill="#2C1810"/>
      <circle cx="134" cy="95" r="2.5" fill="#FFF"/>
      <circle cx="170" cy="95" r="2.5" fill="#FFF"/>
      <!-- 볼터치 -->
      <circle cx="118" cy="113" r="7" fill="#FFB5B5" opacity="0.5"/>
      <circle cx="182" cy="113" r="7" fill="#FFB5B5" opacity="0.5"/>
      <!-- 입 -->
      <path d="M136 124 Q150 138 164 124" stroke="#4A3520" stroke-width="2" fill="#FF8B8B" stroke-linecap="round"/>
      <!-- 공 -->
      <text x="210" y="200" font-size="22">⚽</text>
    `,
    sleeping: `
      <!-- 눈 (잠자는) -->
      <line x1="125" y1="100" x2="139" y2="100" stroke="#2C1810" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="161" y1="100" x2="175" y2="100" stroke="#2C1810" stroke-width="2.5" stroke-linecap="round"/>
      <!-- 볼터치 -->
      <circle cx="118" cy="113" r="8" fill="#FFB5B5" opacity="0.3"/>
      <circle cx="182" cy="113" r="8" fill="#FFB5B5" opacity="0.3"/>
      <!-- 입 -->
      <path d="M144 128 Q150 132 156 128" stroke="#4A3520" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <!-- Zzz -->
      <text x="188" y="65" font-size="16" fill="#6B7FD7" font-weight="bold">Z</text>
      <text x="200" y="48" font-size="13" fill="#6B7FD7" opacity="0.7" font-weight="bold">Z</text>
      <text x="210" y="35" font-size="10" fill="#6B7FD7" opacity="0.4" font-weight="bold">Z</text>
    `,
    bored: `
      <!-- 눈 (심심) -->
      <circle cx="132" cy="102" r="4" fill="#2C1810"/>
      <circle cx="168" cy="102" r="4" fill="#2C1810"/>
      <circle cx="133" cy="100" r="1.5" fill="#FFF"/>
      <circle cx="169" cy="100" r="1.5" fill="#FFF"/>
      <!-- 입 -->
      <line x1="142" y1="130" x2="158" y2="130" stroke="#4A3520" stroke-width="2" stroke-linecap="round"/>
      <!-- 물음표 -->
      <text x="190" y="75" font-size="16" fill="#999">?</text>
    `,
    levelup: `
      <!-- 눈 (레벨업!) -->
      <text x="122" y="107" font-size="15">⭐</text>
      <text x="158" y="107" font-size="15">⭐</text>
      <!-- 볼터치 -->
      <circle cx="118" cy="118" r="10" fill="#FFD700" opacity="0.5"/>
      <circle cx="182" cy="118" r="10" fill="#FFD700" opacity="0.5"/>
      <!-- 입 -->
      <path d="M134 126 Q150 146 166 126" stroke="#4A3520" stroke-width="2" fill="#FF8B8B" stroke-linecap="round"/>
      <!-- 축하 이펙트 -->
      <text x="85" y="50" font-size="14">🎉</text>
      <text x="195" y="45" font-size="16">🎊</text>
      <text x="145" y="28" font-size="12">✨</text>
    `
  };

  // 물결 애니메이션 (해달은 물 위에 떠있으니까!)
  const waterAnimation = `
    <defs>
      <linearGradient id="water-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#87CEEB" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#4A90D9" stop-opacity="0.2"/>
      </linearGradient>
    </defs>
    <ellipse cx="150" cy="275" rx="90" ry="12" fill="url(#water-grad)">
      <animate attributeName="rx" values="90;95;90" dur="2s" repeatCount="indefinite"/>
    </ellipse>
    <ellipse cx="150" cy="275" rx="70" ry="8" fill="#87CEEB" opacity="0.15">
      <animate attributeName="rx" values="70;75;70" dur="1.8s" repeatCount="indefinite"/>
    </ellipse>
  `;

  // 둥둥 떠다니는 애니메이션
  const floatAnimation = `
    <animateTransform attributeName="transform" type="translate"
      values="0,0; 0,-5; 0,0" dur="3s" repeatCount="indefinite"/>
  `;

  // ===== 스탯 기반 비주얼 오버레이 생성 =====
  function buildStatOverlays(stats) {
    if (!stats) return '';
    let svg = '';
    const { fullness = 50, cleanliness = 50, happiness = 50 } = stats;

    // --- 배고픔 오버레이 (포만감 낮을 때) ---
    if (fullness < 30) {
      const intensity = fullness < 15 ? 0.8 : 0.4;
      // 배 꼬르륵 물결선
      svg += `
        <g opacity="${intensity}">
          <path d="M135 215 Q140 210 145 215 Q150 220 155 215" stroke="#D4A04A" stroke-width="1.5" fill="none" stroke-linecap="round">
            <animate attributeName="d" values="M135 215 Q140 210 145 215 Q150 220 155 215;M135 218 Q140 213 145 218 Q150 223 155 218;M135 215 Q140 210 145 215 Q150 220 155 215" dur="1.5s" repeatCount="indefinite"/>
          </path>
          <path d="M140 225 Q145 220 150 225 Q155 230 160 225" stroke="#D4A04A" stroke-width="1.2" fill="none" stroke-linecap="round">
            <animate attributeName="d" values="M140 225 Q145 220 150 225 Q155 230 160 225;M140 228 Q145 223 150 228 Q155 233 160 228;M140 225 Q145 220 150 225 Q155 230 160 225" dur="1.8s" repeatCount="indefinite"/>
          </path>
        </g>
      `;
      // 위급하면 배고픔 이모지
      if (fullness < 15) {
        svg += `<text x="75" y="210" font-size="16" opacity="0.7">🐚</text>
                <text x="68" y="215" font-size="10" opacity="0.5">?</text>`;
      }
    }

    // --- 더러움 오버레이 (청결도 낮을 때) ---
    if (cleanliness < 30) {
      const intensity = cleanliness < 15 ? 0.7 : 0.35;
      // 먼지/얼룩 점
      svg += `
        <g opacity="${intensity}">
          <circle cx="115" cy="190" r="3" fill="#8B7355"/>
          <circle cx="125" cy="205" r="2.5" fill="#8B7355"/>
          <circle cx="178" cy="195" r="2.8" fill="#8B7355"/>
          <circle cx="170" cy="215" r="2" fill="#8B7355"/>
        </g>
      `;
      // 위급하면 땀방울 + 파리
      if (cleanliness < 15) {
        svg += `
          <path d="M195 88 Q192 98 195 105" stroke="#5BC0EB" stroke-width="2" fill="none" opacity="0.6">
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite"/>
          </path>
          <text x="210" y="175" font-size="10" opacity="0.5">💦</text>
        `;
      }
    }

    // --- 슬픔 오버레이 (행복도 낮을 때) ---
    if (happiness < 30) {
      const intensity = happiness < 15 ? 0.6 : 0.3;
      // 어두운 구름
      svg += `
        <g opacity="${intensity}">
          <ellipse cx="150" cy="30" rx="40" ry="15" fill="#94A3B8"/>
          <ellipse cx="135" cy="28" rx="25" ry="12" fill="#94A3B8"/>
          <ellipse cx="168" cy="26" rx="28" ry="13" fill="#94A3B8"/>
        </g>
      `;
      // 위급하면 빗방울
      if (happiness < 15) {
        svg += `
          <line x1="140" y1="42" x2="138" y2="55" stroke="#5BC0EB" stroke-width="1.5" opacity="0.4">
            <animate attributeName="y2" values="55;65;55" dur="1s" repeatCount="indefinite"/>
          </line>
          <line x1="155" y1="44" x2="153" y2="58" stroke="#5BC0EB" stroke-width="1.5" opacity="0.3">
            <animate attributeName="y2" values="58;68;58" dur="1.2s" repeatCount="indefinite"/>
          </line>
          <line x1="165" y1="40" x2="163" y2="52" stroke="#5BC0EB" stroke-width="1.5" opacity="0.35">
            <animate attributeName="y2" values="52;62;52" dur="0.9s" repeatCount="indefinite"/>
          </line>
        `;
      }
    }

    // --- 행복 오버레이 (행복도 높을 때) ---
    if (happiness > 85) {
      // 반짝이는 스파클 파티클
      svg += `
        <g class="sparkle-overlay">
          <text x="85" y="55" font-size="10" opacity="0.6">✨</text>
          <text x="205" y="60" font-size="8" opacity="0.4">✨</text>
          <text x="70" y="175" font-size="9" opacity="0.5">⭐</text>
          <text x="225" y="165" font-size="8" opacity="0.4">⭐</text>
        </g>
      `;
    }

    // --- 최고 상태 오버레이 (전체 높음) ---
    if (fullness > 80 && cleanliness > 80 && happiness > 80) {
      // 황금 오라 글로우
      svg += `
        <circle cx="150" cy="150" r="95" fill="none" stroke="#FFD700" stroke-width="3" opacity="0.15">
          <animate attributeName="r" values="95;100;95" dur="2.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.15;0.08;0.15" dur="2.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="150" cy="150" r="105" fill="none" stroke="#FFD700" stroke-width="1.5" opacity="0.08">
          <animate attributeName="r" values="105;112;105" dur="3s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.08;0.04;0.08" dur="3s" repeatCount="indefinite"/>
        </circle>
      `;
    }

    // --- 위급 상태 오버레이 (전체 낮음) ---
    if (fullness < 20 && cleanliness < 20 && happiness < 20) {
      // 빨간 경고 펄스
      svg += `
        <circle cx="150" cy="150" r="100" fill="none" stroke="#EF4444" stroke-width="2" opacity="0">
          <animate attributeName="opacity" values="0;0.3;0" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="r" values="100;110;100" dur="1.5s" repeatCount="indefinite"/>
        </circle>
      `;
    }

    return svg;
  }

  /**
   * 상태에 맞는 SVG 생성
   * @param {string} state - 캐릭터 상태
   * @param {object} [stats] - 스탯 객체 { fullness, cleanliness, happiness }
   * @returns {string} SVG 문자열
   */
  function render(state = 'default', stats = null) {
    const face = faces[state] || faces.default;
    const overlays = buildStatOverlays(stats);
    return `
      <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" class="otter-svg">
        ${waterAnimation}
        ${overlays}
        <g class="otter-body">
          ${floatAnimation}
          ${body}
          ${head}
          ${face}
        </g>
      </svg>
    `;
  }

  /**
   * 컨테이너에 혜달이를 렌더링
   * @param {string} containerId - 컨테이너 DOM id
   * @param {string} state - 캐릭터 상태
   * @param {object} [stats] - 스탯 객체 (선택)
   */
  function mount(containerId, state, stats) {
    const el = document.getElementById(containerId);
    if (!el) return;

    el.innerHTML = render(state, stats);

    // 스탯 기반 웰니스 레벨을 data attribute로 설정 (CSS 효과용)
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
