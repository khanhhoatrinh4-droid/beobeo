package com.fastfood.management.controller;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class ImageUploadController {
    private final Path directory;

    public ImageUploadController(@Value("${fasty.upload-directory:uploads/images}") String directory) {
        this.directory = Path.of(directory).toAbsolutePath().normalize();
    }

    @PostMapping(value = "/api/admin/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty() || file.getSize() > 5 * 1024 * 1024) {
            throw invalid("Vui lòng chọn ảnh có dung lượng tối đa 5 MB.");
        }
        BufferedImage image;
        try (ImageInputStream input = ImageIO.createImageInputStream(file.getInputStream())) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw invalid("Vui lòng chọn ảnh JPG, PNG hoặc GIF hợp lệ.");
            ImageReader reader = readers.next();
            try {
                String format = reader.getFormatName().toLowerCase(java.util.Locale.ROOT);
                if (!java.util.Set.of("jpeg", "png", "gif").contains(format)) {
                    throw invalid("Vui lòng chọn ảnh JPG, PNG hoặc GIF.");
                }
                reader.setInput(input);
                if ((long) reader.getWidth(0) * reader.getHeight(0) > 16_000_000) {
                    throw invalid("Ảnh quá lớn. Vui lòng chọn ảnh tối đa 16 triệu điểm ảnh.");
                }
                image = reader.read(0);
            } finally {
                reader.dispose();
            }
        } catch (IOException | IllegalArgumentException exception) {
            throw invalid("Không đọc được ảnh. Vui lòng chọn ảnh JPG, PNG hoặc GIF hợp lệ.");
        }
        Files.createDirectories(directory);
        String filename = UUID.randomUUID() + ".png";
        Path target = directory.resolve(filename);
        try {
            ImageIO.write(image, "png", target.toFile());
        } catch (IOException exception) {
            Files.deleteIfExists(target);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không lưu được ảnh. Vui lòng thử lại.");
        }
        return Map.of("imageUrl", "/images/uploads/" + filename);
    }

    @GetMapping("/images/uploads/{filename}")
    public ResponseEntity<Resource> image(@PathVariable String filename) {
        if (!filename.matches("[a-f0-9-]{36}\\.png")) return ResponseEntity.notFound().build();
        Path file = directory.resolve(filename);
        if (!Files.isRegularFile(file)) return ResponseEntity.notFound().build();
        return ResponseEntity.ok().contentType(MediaType.IMAGE_PNG).body(new FileSystemResource(file));
    }

    private ResponseStatusException invalid(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> uploadError(ResponseStatusException exception) {
        return ResponseEntity.status(exception.getStatusCode())
                .body(Map.of("message", exception.getReason()));
    }
}
