-- 혜달이 Supabase 테이블 초기화
-- Supabase Dashboard > SQL Editor 에서 실행하세요

CREATE TABLE otter_stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    fullness DOUBLE PRECISION NOT NULL DEFAULT 50,
    cleanliness DOUBLE PRECISION NOT NULL DEFAULT 50,
    happiness DOUBLE PRECISION NOT NULL DEFAULT 50,
    exp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    last_update DOUBLE PRECISION NOT NULL
);

INSERT INTO otter_stats (id, fullness, cleanliness, happiness, exp, level, last_update)
VALUES (1, 50, 50, 50, 0, 1, EXTRACT(EPOCH FROM NOW()));
