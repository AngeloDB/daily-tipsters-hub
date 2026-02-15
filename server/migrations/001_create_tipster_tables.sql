-- Tipsters Table
CREATE TABLE IF NOT EXISTS tp_tipsters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(255),
    bio TEXT,
    win_rate DECIMAL(5,2) DEFAULT 0,
    total_profit DECIMAL(10,2) DEFAULT 0,
    total_picks INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES wp_users(id) ON DELETE CASCADE
);

-- Saved Bets Table (for users to save their picks)
CREATE TABLE IF NOT EXISTS tp_saved_bets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_odds DECIMAL(10,2) NOT NULL,
    stake DECIMAL(10,2) NOT NULL,
    potential_win DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES wp_users(id) ON DELETE CASCADE
);

-- Saved Bet Selections
CREATE TABLE IF NOT EXISTS tp_saved_bet_selections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    saved_bet_id INT NOT NULL,
    match_id BIGINT UNSIGNED NOT NULL,
    market VARCHAR(100) NOT NULL,
    selection VARCHAR(100) NOT NULL,
    odd DECIMAL(5,2) NOT NULL,
    FOREIGN KEY (saved_bet_id) REFERENCES tp_saved_bets(id) ON DELETE CASCADE,
    FOREIGN KEY (match_id) REFERENCES wp_football_matches(fixture_id) ON DELETE CASCADE
);

