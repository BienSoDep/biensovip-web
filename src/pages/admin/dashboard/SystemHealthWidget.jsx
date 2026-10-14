import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useSystemHealth, useTestSystemEmail } from '../../../services/systemHealth.js';

const HEALTH_LABEL = { ok: 'Ổn định', degraded: 'Cần chú ý', down: 'Sự cố', running: 'Đang chạy' };
const HEALTH_COLOR = {
  ok: 'var(--status-success-ink)',
  degraded: 'var(--status-warning-ink)',
  down: 'var(--status-danger)',
  running: 'var(--action-primary)',
};

export default function SystemHealthWidget() {
  const { data, isLoading, refetch, isFetching } = useSystemHealth();
  const { sendTestEmail } = useTestSystemEmail();
  const [testingEmail, setTestingEmail] = useState(false);
  const [showJobs, setShowJobs] = useState(false);

  if (isLoading || !data) return null;

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      const res = await sendTestEmail();
      toast.success(res?.data || 'Đã gửi email kiểm tra thành công!');
      refetch();
    } catch (err) {
      toast.error(err?.message || 'Gửi email kiểm tra thất bại.');
    } finally {
      setTestingEmail(false);
    }
  };

  const metrics = data.serverMetrics;
  const jobs = data.jobsLastRun || [];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
      background: 'var(--white)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--gutter-card)',
      boxShadow: 'var(--shadow-inset-hairline)',
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', fontWeight: 'var(--fw-bold)' }}>
            Hạ tầng &amp; Trạng thái hệ thống
          </span>

          {/* Database */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-body-sm)' }}>
            <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: HEALTH_COLOR[data.dbStatus] || 'var(--text-faint)', display: 'inline-block' }} />
            Database: <b style={{ color: HEALTH_COLOR[data.dbStatus] }}>{HEALTH_LABEL[data.dbStatus] || data.dbStatus}</b>
            {data.dbLatencyMs != null && (
              <span style={{ color: data.dbLatencyMs > 100 ? 'var(--status-warning-ink)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', fontSize: '0.8rem' }}>
                ({data.dbLatencyMs}ms)
              </span>
            )}
          </span>

          {/* Email */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-body-sm)' }}>
            <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: HEALTH_COLOR[data.emailStatus] || 'var(--text-faint)', display: 'inline-block' }} />
            Email (SMTP): <b style={{ color: HEALTH_COLOR[data.emailStatus] }}>{HEALTH_LABEL[data.emailStatus] || data.emailStatus}</b>
            {data.lastEmailFailedAt && data.emailStatus === 'down' && (
              <span style={{ color: 'var(--status-danger)', fontSize: '0.8rem' }}>
                (lỗi: {new Date(data.lastEmailFailedAt).toLocaleTimeString('vi-VN')})
              </span>
            )}
          </span>

          {/* Redis */}
          {data.redisStatus && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-body-sm)' }}>
              <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: HEALTH_COLOR[data.redisStatus] || 'var(--text-faint)', display: 'inline-block' }} />
              Redis Cache: <b style={{ color: HEALTH_COLOR[data.redisStatus] }}>{HEALTH_LABEL[data.redisStatus] || data.redisStatus}</b>
            </span>
          )}

          {/* Proxy VPA */}
          {data.proxyServer && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-body-sm)' }}>
              <span aria-hidden style={{
                width: 8, height: 8, borderRadius: '50%',
                background: data.proxyServer.Status === 'ok' ? '#3FBF8F' : (data.proxyServer.Status === 'blocked' ? '#ea580c' : (data.proxyServer.Status === 'not_configured' ? '#6b7280' : '#dc2626')),
                display: 'inline-block'
              }} />
              Proxy VPA: <b style={{
                color: data.proxyServer.Status === 'ok' ? '#3FBF8F' : (data.proxyServer.Status === 'blocked' ? '#ea580c' : '#dc2626')
              }}>
                {data.proxyServer.Status === 'ok' ? 'Online' : (data.proxyServer.Status === 'blocked' ? 'Bị 403' : (data.proxyServer.Status === 'not_configured' ? 'Chưa bật' : 'Mất kết nối'))}
              </b>
              {data.proxyServer.LatencyMs > 0 && (
                <span style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', fontSize: '0.8rem' }}>
                  ({data.proxyServer.LatencyMs}ms)
                </span>
              )}
            </span>
          )}

          {/* Server Metrics (CPU / RAM / Disk / Uptime) */}
          {metrics && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', font: 'var(--type-caption)', color: 'var(--text-muted)', background: 'var(--surface-sunken)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
              {data.mainServer?.Disk && (
                <>
                  <span>Ổ đĩa: <b style={{ color: data.mainServer.Disk.Status === 'danger' ? 'var(--status-danger)' : 'inherit' }}>{data.mainServer.Disk.UsedGb}/{data.mainServer.Disk.TotalGb}GB ({data.mainServer.Disk.UsedPercent}%)</b></span>
                  <span>•</span>
                </>
              )}
              <span>RAM: <b>{metrics.memoryUsedMb}MB</b></span>
              <span>•</span>
              <span>Uptime: <b>{metrics.uptimeHours}h</b></span>
            </span>
          )}
        </div>

        {/* Nút hành động */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <button
            type="button"
            onClick={handleTestEmail}
            disabled={testingEmail}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-hairline)',
              background: 'var(--white)',
              color: 'var(--text-body)',
              font: 'var(--type-caption)',
              fontWeight: 'var(--fw-medium)',
              cursor: testingEmail ? 'not-allowed' : 'pointer',
              opacity: testingEmail ? 0.6 : 1,
            }}
          >
            {testingEmail ? 'Đang gửi thử...' : 'Gửi mail test'}
          </button>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-hairline)',
              background: 'var(--white)',
              color: 'var(--text-body)',
              font: 'var(--type-caption)',
              fontWeight: 'var(--fw-medium)',
              cursor: isFetching ? 'not-allowed' : 'pointer',
              opacity: isFetching ? 0.6 : 1,
            }}
          >
            {isFetching ? 'Đang kiểm tra...' : 'Kiểm tra lại'}
          </button>

          <a
            href="/admin?tab=afeatureflags&subtab=servers"
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-hairline)',
              background: 'var(--surface-sunken)',
              color: 'var(--action-primary)',
              font: 'var(--type-caption)',
              fontWeight: 'var(--fw-semibold)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Chi tiết 2 máy chủ &rarr;
          </a>

          <button
            type="button"
            onClick={() => setShowJobs(!showJobs)}
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'transparent',
              color: 'var(--action-primary)',
              font: 'var(--type-caption)',
              fontWeight: 'var(--fw-medium)',
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {showJobs ? (
                <>
                  Ẩn Background Jobs <ChevronUp size={12} />
                </>
              ) : (
                <>
                  Xem Jobs ngầm ({jobs.length}) <ChevronDown size={12} />
                </>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Danh sách Background Jobs ngầm khi mở rộng */}
      {showJobs && (
        <div style={{
          marginTop: 'var(--space-2)',
          paddingTop: 'var(--space-3)',
          borderTop: '1px solid var(--border-hairline)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--space-2)',
        }}>
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <div
                key={job.jobName}
                style={{
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-sunken)',
                  border: '1px solid var(--border-hairline)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  font: 'var(--type-caption)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                  <span
                    aria-hidden
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: HEALTH_COLOR[job.status] || 'var(--text-faint)',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontWeight: 'var(--fw-medium)', color: 'var(--text-strong)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {job.jobName}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={{ color: 'var(--text-faint)', fontSize: '0.75rem' }}>
                    {job.lastRunAt ? format(new Date(job.lastRunAt), 'HH:mm:ss') : 'Chưa chạy'}
                  </span>
                  <span style={{ color: HEALTH_COLOR[job.status] || 'var(--text-muted)', fontWeight: 'var(--fw-bold)' }}>
                    {HEALTH_LABEL[job.status] || job.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              Đang đồng bộ trạng thái background jobs...
            </span>
          )}
        </div>
      )}
    </div>
  );
}
