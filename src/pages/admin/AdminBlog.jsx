import AdminTabbedPage from '../../components/AdminTabbedPage.jsx';
import AdminPosts from './AdminPosts.jsx';
import AdminBlogComments from './AdminBlogComments.jsx';

// Gộp Bài viết + Bình luận blog thành 1 trang 2 tab — cùng chủ đề nội dung blog.
export default function AdminBlog({ st, patch, notify }) {
  return (
    <AdminTabbedPage
      tabs={[
        { key: 'posts', label: 'Bài viết', render: () => <AdminPosts st={st} patch={patch} notify={notify} /> },
        { key: 'comments', label: 'Bình luận', render: () => <AdminBlogComments notify={notify} /> },
      ]}
    />
  );
}
