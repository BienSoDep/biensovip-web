import AdminTabbedPage from '../../components/AdminTabbedPage.jsx';
import AdminPosts from './AdminPosts.jsx';
import AdminBlogComments from './AdminBlogComments.jsx';

// Gộp Bài viết + Bình luận blog thành 1 trang 2 tab — cùng chủ đề nội dung blog.
export default function AdminBlog({ st, patch, notify }) {
  return (
    <AdminTabbedPage
      tabs={[
        { key: 'posts', label: 'Bài viết', info: 'Quản lý, soạn thảo và xuất bản bài viết blog chuẩn SEO', render: () => <AdminPosts st={st} patch={patch} notify={notify} /> },
        { key: 'comments', label: 'Bình luận', info: 'Kiểm duyệt và phản hồi ý kiến độc giả trên các bài viết', render: () => <AdminBlogComments notify={notify} /> },
      ]}
    />
  );
}
