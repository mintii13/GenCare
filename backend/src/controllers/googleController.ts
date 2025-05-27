import express from 'express'
import passport from '../configs/passport'
import { Request, Response } from 'express'

const router = express.Router();
//viết endpoint để điều hướng
router.get("/", (req, res) => {
  res.send("<a href='/auth/google'>Login with google</a>")        //nơi truyền frontend để input (FRONTEND)
})

//hàm này là khi truy cập vào đường dẫn này sẽ tiến hành xác thực vs google
router.get(
  "/auth/google",  passport.authenticate('google', {scope: ["openid", "profile", "email"]})
);

router.get("/auth/google/callback", passport.authenticate('google', {failureRedirect: "/"}), (req, res) => {
  res.redirect('/profile');
})                                                                //thực hiện bước đổi code lấy token như đã thiết lập trên gg Strategy

router.get('/profile', (req, res) => {
  // res.send(`Welcome: ${(req.user as any).displayName}`);           //trích xuất thông tin quăng ra màn hình
  // res.send(`Welcome: ${(req.user as any).name.familyName}`);       //trích xuất thông tin trong một object
  // res.send(`Welcome: ${(req.user as any).emails[0].value}`)        //trích xuất từng thông tin một (emails, photos có nhiều nên lưu ở dạng Array)
  res.json(req.user);                                                 //trích xuất cả JSON
  console.log(req.user);
})

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error logging out' });
    }
    res.redirect('/');
  });
})

export default router;

export const googleAuth = (req: Request, res: Response) => {
  res.send('Google auth');
};

export const googleCallback = (req: Request, res: Response) => {
  res.json(req.user);
  console.log(req.user);
};

export const googleLogout = (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error logging out' });
    }
    res.redirect('/');
  });
};