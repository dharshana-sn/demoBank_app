import { CaptchaGenerator } from 'captcha-canvas';

try {
    const captcha = new CaptchaGenerator()
        .setDimension(150, 50)
        .setCaptcha({ size: 30, color: "blue" })
        .setDecoy({ opacity: 0.5 })
        .setTrace({ color: "blue" });

    const buffer = await captcha.generate();
    console.log("Text:", captcha.text);
    console.log("Buffer size:", buffer.length);
} catch (e) {
    console.error("Error:", e.message);
}
