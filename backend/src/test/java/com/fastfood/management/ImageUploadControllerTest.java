package com.fastfood.management;

import com.fastfood.management.controller.ImageUploadController;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ImageUploadControllerTest {
    @TempDir Path directory;

    @Test
    void uploadedImageRemainsReadableFromANewController() throws Exception {
        var controller = new ImageUploadController(directory.toString());
        var bytes = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(3, 2, BufferedImage.TYPE_INT_RGB), "png", bytes);
        var upload = new MockMultipartFile("file", "../../photo.png", "image/png", bytes.toByteArray());
        String url = controller.upload(upload).get("imageUrl");
        assertTrue(url.matches("/images/uploads/[a-f0-9-]{36}\\.png"));
        var mvc = MockMvcBuilders.standaloneSetup(new ImageUploadController(directory.toString())).build();
        mvc.perform(get(url)).andExpect(status().isOk()).andExpect(content().contentType("image/png"));
        var saved = ImageIO.read(directory.resolve(url.substring(url.lastIndexOf('/') + 1)).toFile());
        assertEquals(3, saved.getWidth());
        assertEquals(2, saved.getHeight());
    }

    @Test
    void rejectsFakeImagesAndOversizedFilesWithoutSaving() throws Exception {
        var controller = new ImageUploadController(directory.toString());
        var mvc = MockMvcBuilders.standaloneSetup(controller).build();
        mvc.perform(multipart("/api/admin/images").file(
                new MockMultipartFile("file", "fake.png", "image/png", "not an image".getBytes())))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").isNotEmpty());
        assertThrows(ResponseStatusException.class, () -> controller.upload(
                new MockMultipartFile("file", "large.png", "image/png", new byte[5 * 1024 * 1024 + 1])));
        try (var files = Files.list(directory)) { assertEquals(0, files.count()); }
    }

    @Test
    void rejectsImagesWithExcessiveDimensionsAndMissingFiles() throws Exception {
        var bytes = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(4001, 4000, BufferedImage.TYPE_BYTE_BINARY), "png", bytes);
        var controller = new ImageUploadController(directory.toString());
        assertThrows(ResponseStatusException.class, () -> controller.upload(
                new MockMultipartFile("file", "huge.png", "image/png", bytes.toByteArray())));
        assertEquals(404, controller.image("missing.png").getStatusCode().value());
        assertEquals(404, controller.image("../secret.png").getStatusCode().value());
    }
}
