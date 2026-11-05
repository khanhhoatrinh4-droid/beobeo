package com.fastfood.management.controller;

import com.fastfood.management.entity.Post;
import com.fastfood.management.repository.PostRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Locale;
import java.text.Normalizer;

@RestController
@RequestMapping("/api/posts")
public class PostController {
    private final PostRepository posts;
    public PostController(PostRepository posts) { this.posts=posts; }
    @GetMapping public List<Post> published() { return posts.findByActiveTrueOrderByCreatedAtDesc(); }
    @GetMapping("/admin/all") public List<Post> all() { return posts.findAll(); }
    @PostMapping public Post create(@RequestBody Post post) { validate(post); post.setId(null); post.setSlug(slug(post.getSlug(), post.getTitle(), null)); return posts.save(post); }
    @PutMapping("/{id}") public Post update(@PathVariable Long id, @RequestBody Post input) {
        validate(input);
        Post post = posts.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        post.setTitle(input.getTitle().trim()); post.setSlug(slug(input.getSlug(), input.getTitle(), id));
        post.setExcerpt(input.getExcerpt()); post.setContent(input.getContent()); post.setImageUrl(input.getImageUrl()); post.setActive(input.isActive());
        return posts.save(post);
    }
    @DeleteMapping("/{id}") public void delete(@PathVariable Long id) { if (!posts.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND); posts.deleteById(id); }
    private void validate(Post post) {
        if (post == null || post.getTitle() == null || post.getTitle().isBlank() || post.getTitle().trim().length() > 180
                || post.getSlug() != null && post.getSlug().length() > 200
                || post.getExcerpt() != null && post.getExcerpt().length() > 500
                || post.getImageUrl() != null && post.getImageUrl().length() > 500) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tiêu đề bắt buộc (tối đa 180 ký tự); slug tối đa 200, mô tả và URL ảnh tối đa 500 ký tự.");
        }
    }
    private String slug(String value, String title, Long excludedId) {
        String source = value == null || value.isBlank() ? title : value;
        String normalized = Normalizer.normalize(source, Normalizer.Form.NFD).replaceAll("\\p{M}+", "").toLowerCase(Locale.ROOT).replace('đ','d');
        String base = normalized.replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        if (base.isBlank()) base = "bai-viet";
        String candidate = base; int suffix = 2;
        while (excludedId == null ? posts.existsBySlug(candidate) : posts.existsBySlugAndIdNot(candidate, excludedId)) candidate = base + "-" + suffix++;
        return candidate;
    }
}
