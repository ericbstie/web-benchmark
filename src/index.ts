import { sql, type BunRequest } from "bun";


if (!import.meta.env.DATABASE_URL) {
  throw new Error("DB Connection failure: DATABASE_URL env variable is not set");
}
console.info("Using database:", import.meta.env.DATABASE_URL);


const server = Bun.serve({
    routes: {
        "/posts": {
            GET: () => sql`SELECT * FROM posts;`,
            POST: req => createPost(req),
        },
        "/posts/:id": req => sql`SELECT * FROM posts WHERE id = ${req.params.id};`,
        "/posts/:id/like": {
            POST: req => likePost(req),
        },
    }
});



async function createPost(req: BunRequest) {
    const jwt = req.headers.get("auth");
    if (!jwt) return Response.json({ message: "Unauthorized" }, { status: 401 });
    
    // TODO: Grab author from verified jwt

    // TODO: Validate body with schema
    const body = await req.json();
    const [postId] = await sql`INSERT INTO posts ${sql(body)} RETURN id;`;

    return Response.json({
        id: postId,
        created: true,
    });
}

async function likePost(req: BunRequest) {
    const jwt = req.headers.get("auth");
    if (!jwt) return Response.json({ message: "Unauthorized" }, { status: 401 });

    // TODO: Grab author from verified jwt
    const like = { user_id: 1, post_id: req.params.id }
    await sql`INSERT INTO likes ${sql(like)};`;

    return Response.json({ created: true }, { status: 201 });
}