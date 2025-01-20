import express from "express";
import { db } from "../drizzle";
import { links } from "../drizzle/schema/links";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema/users";

const userRouter = express.Router();

userRouter.get("/:userAddress/redirects", async (req, res) => {
  const { userAddress } = req.params;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.address, userAddress));

  console.log("user", user);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const redirects = await db
    .select()
    .from(links)
    .where(eq(links.user_id, user.id));

  console.log("redirects", redirects);
  return res.json(redirects);
});

userRouter.post("/:userAddress/redirects", async (req, res) => {
  const { userAddress } = req.params;
  const { linkItems } = req.body;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.address, userAddress));

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  await db.delete(links).where(eq(links.user_id, user.id));

  type linkItem = {
    description: string;
    link: string;
    secret: boolean;
  };

  let insertedLinks = [];
  if (linkItems.length > 0) {
    insertedLinks = await db.insert(links).values(
      linkItems.map((linkItem: linkItem) => ({
        user_id: user.id,
        description: linkItem.description,
        link: linkItem.link,
        secret: linkItem.secret,
      }))
    );
  } else {
    insertedLinks = [];
  }

  return res.json({
    links: insertedLinks,
    user: {
      address: user.address,
      username: user.username,
    },
  });
});

export default userRouter;
