import { sql, type BunRequest } from "bun";
import frontend from "./index.html";


if (!import.meta.env.DATABASE_URL) {
  throw new Error("DB Connection failure: DATABASE_URL env variable is not set");
}
console.info("Using database:", import.meta.env.DATABASE_URL);


const server = Bun.serve({
    routes: {
        "/feed": req => getFeedPage(req),
        "/posts": {
            POST: req => createPost(req),
        },
        "/posts/:id": req => sql`SELECT * FROM posts WHERE id = ${req.params.id};`.then(([result]) => Response.json(result)),
        "/posts/:id/like": {
            POST: req => likePost(req),
        },
        "/": frontend,
    }
});
console.info("Server running on:", server.url.origin);



function getFeedPage(req: BunRequest) {
    const searchParams = new URL(req.url).searchParams;

    const offset = searchParams.get("offset") ?? 0;
    const limit = searchParams.get("limit") ?? 50;

    return sql`
        SELECT * FROM posts
        ORDER BY created_at DESC
        OFFSET ${offset}
        LIMIT ${limit};
    `.then(result => Response.json(result));
}

async function createPost(req: BunRequest) {
    const jwt = req.headers.get("auth");
    if (!jwt) return Response.json({ message: "Unauthorized" }, { status: 401 });
    
    // TODO: Grab author from verified jwt

    // TODO: Validate body with schema
    const body = await req.json();
    const [postId] = await sql`INSERT INTO posts ${sql(body)} RETURNING id;`;

    return Response.json({
        id: postId,
        created: true,
    });
}

async function likePost(req: BunRequest) {
    const jwt = req.headers.get("auth");
    if (!jwt) return Response.json({ message: "Unauthorized" }, { status: 401 });

    // TODO: Grab author from verified jwt
    const like = { user_id: jwt, post_id: req.params.id };

    // Delete entry if it's already liked
    const [alreadyLiked] = await sql`SELECT COUNT(*) FROM likes WHERE user_id = ${like.user_id} AND post_id = ${like.post_id}`;

    if (alreadyLiked.count > 0) {
        await sql`DELETE FROM likes WHERE user_id = ${like.user_id} AND post_id = ${like.post_id}`;
        return Response.json({ postId: like.post_id, liked: false }, { status: 201 });
    }

    await sql`INSERT INTO likes ${sql(like)};`;
    return Response.json({ postId: like.post_id, liked: true }, { status: 201 });
}