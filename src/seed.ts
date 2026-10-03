if (!import.meta.env.DATABASE_URL) {
  throw new Error("DB Connection failure: DATABASE_URL env variable is not set");
}
console.info("Connecting to database:", import.meta.env.DATABASE_URL);


import { sql } from "bun";

console.debug("Dropping tables");
await sql`DROP TABLE IF EXISTS likes, posts, users`;

console.debug("Creating users table");
await sql`CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);`;

console.debug("Creating posts table");
await sql`CREATE TABLE IF NOT EXISTS posts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    author_id BIGINT REFERENCES users(id),
    body VARCHAR(280),
    created_at TIMESTAMPTZ DEFAULT NOW()
);`;

console.debug("Creating likes table");
await sql`CREATE TABLE IF NOT EXISTS likes (
    post_id BIGINT REFERENCES posts(id),
    user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);`;


const USER_COUNT = 50_000;
const POST_COUNT = 500_000;
const LIKE_COUNT = 2_016_005;



console.debug("Populating users");
const usersInsertData = [...Array(USER_COUNT).keys()].map(
    i => ({
        username: `user-${i}`
    })
);
const users = await sql`INSERT INTO users ${sql(usersInsertData)} RETURNING *` as { id: number }[];



console.debug("Populating posts")
const postsInsertData = Array(POST_COUNT).fill(undefined).map(() => ({
    author_id: randomChoice(users).id,
    body: generateBody().substring(0, 280)
}));

// "the PostgreSQL wire protocol supports a maximum of 65535 parameters per query." :--)
let i = 0;
while (i < postsInsertData.length) {
    const batch = postsInsertData.slice(i, i+20_000);
    i += 20_000;
    await sql`INSERT INTO posts ${sql(batch)};`;
}
const posts = await sql`SELECT * FROM posts;` as { id: number }[];



console.debug("Populating likes");
const likesInsertData = [];
loop: for (const user of users) {
    for (const post of posts) {
        likesInsertData.push({
            post_id: post.id,
            user_id: user.id
        })
        if (likesInsertData.length >= LIKE_COUNT) break loop;
    }
}

i = 0;
while (i < likesInsertData.length) {
    const batch = likesInsertData.slice(i, i+20_000);
    i += 20_000;
    await sql`INSERT INTO likes ${sql(batch)};`;
}



function randomChoice<T>(array: T[]) {
    return array[Math.floor(array.length * Math.random())]!;
}

function generateBody(minWordCount=10, maxWordCount=40) {
    const words = ["coffee", "tea", "apple", "the", "from", "Arjay", "likes", "when", "time"];
    const length = minWordCount + Math.floor(Math.random() * (maxWordCount - minWordCount + 1));
    return new Array(length)
        .fill(undefined)
        .map(() => randomChoice(words))
        .join(" ");
}