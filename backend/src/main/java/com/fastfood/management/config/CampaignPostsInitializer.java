package com.fastfood.management.config;

import com.fastfood.management.entity.Post;
import com.fastfood.management.repository.PostRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/** Ensures the homepage always has the current seasonal campaign announcements. */
@Component
public class CampaignPostsInitializer implements ApplicationRunner {
    private final PostRepository posts;
    private final JdbcTemplate jdbc;

    public CampaignPostsInitializer(PostRepository posts, JdbcTemplate jdbc) {
        this.posts = posts;
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        // Existing databases may have been created with MySQL's legacy 3-byte UTF-8.
        // Convert only the table that stores campaign text so emoji can be persisted.
        jdbc.execute("ALTER TABLE posts CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        ensurePost(
                "halloween-beobeo-tiec-ma-vui-ve",
                "Halloween beobeo: Tiệc ma vui vẻ, combo ngon hết sẩy!",
                "🎃 Mùa Halloween đã đến beobeo! Cùng khám phá các combo Bí Ngô Ma Thuật, Hội Ma Bạn Bè "
                        + "và Đại Tiệc Bí Ngô để tụ họp, thưởng thức món ngon và tận hưởng không khí lễ hội.",
                "Halloween này, beobeo mời bạn mở tiệc cùng những combo theo chủ đề dành cho mọi cuộc vui. "
                        + "Combo Bí Ngô Ma Thuật dành cho đôi bạn, Combo Hội Ma Bạn Bè cho buổi tụ họp rôm rả, "
                        + "còn Combo Đại Tiệc Bí Ngô sẵn sàng cho cả gia đình. Chọn món yêu thích, rủ mọi người "
                        + "cùng nhập tiệc và đón một mùa Halloween thật vui bên beobeo!",
                "/images/combo-family.jpg"
        );
        ensurePost(
                "beobeo-uu-dai-11-11-sap-dien-ra",
                "Sắp diễn ra: Ngày hội săn ưu đãi 11/11 tại beobeo",
                "🛍️ Đánh dấu lịch 11/11! beobeo chuẩn bị ngày hội săn deal với nhiều món ngon và combo hấp dẫn. "
                        + "Theo dõi website để cập nhật ưu đãi và điều kiện tham gia khi chương trình bắt đầu.",
                "Ngày hội ưu đãi 11/11 sắp đến tại beobeo! Đây là dịp để bạn thưởng thức những món yêu thích "
                        + "và khám phá các combo hấp dẫn trong chương trình đặc biệt. Hãy theo dõi website beobeo "
                        + "để cập nhật thời gian, mức ưu đãi và điều kiện áp dụng chính thức. Rủ bạn bè cùng lưu "
                        + "lịch và sẵn sàng săn deal ngày 11/11 nhé!",
                "/images/combo-two.jpg"
        );
    }

    private void ensurePost(String slug, String title, String excerpt, String content, String imageUrl) {
        if (posts.existsBySlug(slug)) {
            return;
        }
        Post post = new Post();
        post.setSlug(slug);
        post.setTitle(title);
        post.setExcerpt(excerpt);
        post.setContent(content);
        post.setImageUrl(imageUrl);
        post.setActive(true);
        posts.save(post);
    }
}
