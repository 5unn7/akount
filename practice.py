def get_post_user(id=user.id):
    with engine.connect() as conn:
        result = select(posts.c.id, posts.c.content).where(posts.c.user_id == id)
        return conn.execute(result).fetchall()  