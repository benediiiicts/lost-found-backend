import zlib from "zlib";
import sharp from "sharp";
import { promisify } from "util";

const gzip = promisify(zlib.gzip);

export const compressFile = async (req, res, contentType, file) => {
    if(contentType.includes("image")) {
        return file;
    }else {
        const acceptEncoding = req.headers['accept-encoding'] || "";
        
        if (acceptEncoding.includes('gzip')) {
            try {
                const compressedBuffer = await gzip(file);
                res.setHeader("Content-Encoding", "gzip");
                return compressedBuffer;
            } catch (err) {
                console.error("Gzip error:", err);
                return file;
            }
        } else {
            return file;
        }
    }
};