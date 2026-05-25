import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/config", async (_req, res): Promise<void> => {
  res.json({
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
  });
});

export default router;
