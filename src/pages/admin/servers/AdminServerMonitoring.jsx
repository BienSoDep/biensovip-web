import { useState } from 'react';
import {
  Server, HardDrive, Cpu, Activity, Wifi, Globe, RefreshCw,
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Clock, Database, Zap, Lightbulb
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSystemHealth, useTestProxyConnection } from '../../../services/systemHealth.js';
import Button from '../../../components/Button.jsx';
import SkeletonBase from '../../../components/skeletons/SkeletonBase.jsx';

const STATUS_CONFIG = {
  ok: { label: 'Ổn định', color: '#3FBF8F', bg: 'rgba(63,191,143, 0.1)', icon: CheckCircle2 },
  degraded: { label: 'Cần chú ý', color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)', icon: AlertTriangle },
  down: { label: 'Sự cố / Mất kết nối', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)', icon: XCircle },
  blocked: { label: 'Bị chặn (403 VPA)', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.1)', icon: AlertTriangle },
  not_configured: { label: 'Chưa cấu hình', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', icon: AlertTriangle },
};

export default function AdminServerMonitoring() {
  const { data: healthData, isLoading, isError, refetch, isFetching } = useSystemHealth();
  const { testProxy } = useTestProxyConnection();
  const [testingProxy, setTestingProxy] = useState(false);

  const handleTestProxy = async () => {
    setTestingProxy(true);
    try {
      const res = await testProxy();
      const p = res?.data || res;
      if (p.status === 'ok') {
        toast.success(`Proxy phản hồi tốt! Độ trễ: ${p.latencyMs}ms, IP: ${p.exitIp || 'VN'}`);
      } else if (p.status === 'blocked') {
        toast.error(`Proxy kết nối được nhưng bị VPA chặn (403 Cloudflare)!`);
      } else {
        toast.error(`Kiểm tra proxy thất bại: ${p.errorMessage || 'Không phản hồi'}`);
      }
      refetch();
    } catch (err) {
      toast.error(err?.message || 'Lỗi khi gọi API kiểm tra proxy.');
    } finally {
      setTestingProxy(false);
    }
  };

  const main = healthData?.mainServer;
  const proxy = healthData?.proxyServer;
  const jobs = healthData?.jobsLastRun || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter-section)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* Header thanh công cụ */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div>
          <h2 style={{ margin: 0, font: 'var(--type-display-3)', color: 'var(--text-strong)' }}>
            Giám sát Máy chủ &amp; Hạ tầng
          </h2>
          <p style={{ margin: '4px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Theo dõi hiệu năng, dung lượng ổ đĩa của VPS chính và tình trạng kết nối của cụm Proxy cào VPA.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              {isFetching ? 'Đang cập nhật…' : 'Làm mới'}
            </span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleTestProxy}
            disabled={testingProxy}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Zap size={14} className={testingProxy ? 'animate-spin' : ''} />
              {testingProxy ? 'Đang kiểm tra Proxy…' : 'Ping Proxy VPA'}
            </span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 'var(--gutter-section)' }}>
          <SkeletonBase height={320} />
          <SkeletonBase height={320} />
        </div>
      ) : isError ? (
        <div style={{ background: 'var(--white)', padding: 'var(--gutter-card)', borderRadius: 'var(--radius-card)', textAlign: 'center', color: 'var(--status-danger)' }}>
          Không thể lấy dữ liệu tình trạng máy chủ.
          <button type="button" onClick={() => refetch()} style={{ marginLeft: 8, color: 'var(--link)', border: 'none', background: 'none', cursor: 'pointer' }}>Thử lại</button>
        </div>
      ) : (
        <>
          {/* Lưới 2 Máy chủ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 'var(--gutter-section)' }}>

            {/* MÁY CHỦ 1: VPS CHÍNH */}
            <div style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-inset-hairline)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Card Header */}
              <div style={{
                padding: 'var(--space-4) var(--gutter-card)',
                boxShadow: 'inset 0 -1px 0 var(--border-hairline)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--space-2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--surface-tint-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--action-primary)' }}>
                    <Server size={20} />
                  </div>
                  <div>
                    <div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
                      Máy chủ 1: VPS Chính
                    </div>
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                      {main?.Role || 'Application, Web, Database & Background Worker'}
                    </div>
                  </div>
                </div>

                {(() => {
                  const cfg = STATUS_CONFIG[main?.Status] || STATUS_CONFIG.ok;
                  const Icon = cfg.icon;
                  return (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-pill)',
                      background: cfg.bg,
                      color: cfg.color,
                      fontSize: 12,
                      fontWeight: 'var(--fw-semibold)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <Icon size={13} /> {cfg.label}
                    </span>
                  );
                })()}
              </div>

              {/* Card Body */}
              <div style={{ padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {/* 1. Dung lượng ổ đĩa */}
                {main?.Disk && (
                  <div style={{ padding: '12px 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', font: 'var(--type-body-sm)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                        <HardDrive size={15} style={{ color: 'var(--action-primary)' }} /> Dung lượng Ổ đĩa ({main.Disk.DriveName})
                      </span>
                      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                        Đã dùng: <b style={{ color: 'var(--text-strong)' }}>{main.Disk.UsedGb} GB</b> / {main.Disk.TotalGb} GB
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: 8, background: 'var(--grey-200)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, main.Disk.UsedPercent)}%`,
                        height: '100%',
                        background: main.Disk.Status === 'danger' ? 'var(--status-danger)' : (main.Disk.Status === 'warning' ? '#f59e0b' : '#3FBF8F'),
                        borderRadius: 'var(--radius-pill)',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: 11 }}>
                      <span>Còn trống: <b style={{ color: '#3FBF8F' }}>{main.Disk.FreeGb} GB</b></span>
                      <span>Mức sử dụng: <b>{main.Disk.UsedPercent}%</b></span>
                    </div>
                  </div>
                )}

                {/* 2. Bộ nhớ RAM */}
                {main?.Memory && (
                  <div style={{ padding: '12px 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', font: 'var(--type-body-sm)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                        <Activity size={15} style={{ color: '#8A8F99' }} /> Bộ nhớ RAM Hệ thống
                      </span>
                      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                        Đã dùng: <b style={{ color: 'var(--text-strong)' }}>{main.Memory.UsedMb.toLocaleString()} MB</b> / {main.Memory.TotalMb.toLocaleString()} MB
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: 8, background: 'var(--grey-200)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, main.Memory.UsedPercent)}%`,
                        height: '100%',
                        background: main.Memory.UsedPercent > 90 ? 'var(--status-danger)' : (main.Memory.UsedPercent > 75 ? '#f59e0b' : '#F19720'),
                        borderRadius: 'var(--radius-pill)',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: 11 }}>
                      <span>App .NET Core chiếm: <b>{main.Memory.ProcessMemoryMb} MB</b></span>
                      <span>Tải RAM: <b>{main.Memory.UsedPercent}%</b></span>
                    </div>
                  </div>
                )}

                {/* 3. Lưới thông số kỹ thuật */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)' }}>
                  <div style={{ padding: '8px 12px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Cpu size={12} /> CPU &amp; Luồng
                    </div>
                    <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', marginTop: 2 }}>
                      {main?.ProcessorCount || 2} Core Cores
                    </div>
                  </div>

                  <div style={{ padding: '8px 12px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> Thời gian Uptime
                    </div>
                    <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', marginTop: 2 }}>
                      {main?.UptimeFormatted || 'Đang tính…'}
                    </div>
                  </div>

                  <div style={{ padding: '8px 12px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Database size={12} /> Database Latency
                    </div>
                    <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-bold)', color: (main?.DbLatencyMs || 0) > 100 ? '#ea580c' : '#3FBF8F', marginTop: 2 }}>
                      {main?.DbLatencyMs != null ? `${main.DbLatencyMs} ms` : '—'}
                    </div>
                  </div>

                  <div style={{ padding: '8px 12px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShieldCheck size={12} /> Nền tảng OS
                    </div>
                    <div style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-medium)', color: 'var(--text-strong)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={main?.OsDescription}>
                      {main?.OsDescription || '.NET Runtime'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MÁY CHỦ 2: PROXY SERVER CÀO VPA */}
            <div style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-inset-hairline)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Card Header */}
              <div style={{
                padding: 'var(--space-4) var(--gutter-card)',
                boxShadow: 'inset 0 -1px 0 var(--border-hairline)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--space-2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--surface-tint-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C75B00' }}>
                    <Wifi size={20} />
                  </div>
                  <div>
                    <div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
                      Máy chủ 2: Proxy Cào VPA
                    </div>
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                      Node trung gian định tuyến IP Việt Nam để vượt rào Cloudflare VPA
                    </div>
                  </div>
                </div>

                {(() => {
                  const cfg = STATUS_CONFIG[proxy?.Status] || STATUS_CONFIG.not_configured;
                  const Icon = cfg.icon;
                  return (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-pill)',
                      background: cfg.bg,
                      color: cfg.color,
                      fontSize: 12,
                      fontWeight: 'var(--fw-semibold)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <Icon size={13} /> {cfg.label}
                    </span>
                  );
                })()}
              </div>

              {/* Card Body */}
              <div style={{ padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {/* 1. Endpoint & IP */}
                <div style={{ padding: '12px 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', font: 'var(--type-body-sm)' }}>
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Địa chỉ Proxy Endpoint:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', background: 'var(--white)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-hairline)' }}>
                      {proxy?.MaskedEndpoint || 'Chưa thiết lập'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', font: 'var(--type-body-sm)', marginTop: 4 }}>
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>IP Thấy từ Internet (Exit IP):</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                      <Globe size={13} style={{ color: '#C75B00' }} />
                      {proxy?.ExitIp ? (
                        <>
                          <span>{proxy.ExitIp}</span>
                          <span style={{ padding: '1px 6px', borderRadius: 4, background: '#3FBF8F', color: '#fff', fontSize: 10, fontWeight: 700 }}>VN</span>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-faint)' }}>Chưa nhận diện</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* 2. Sức khỏe kết nối & VPA Status */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)' }}>
                  <div style={{ padding: '10px 12px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                      Độ trễ Round-Trip
                    </div>
                    <div style={{ font: 'var(--type-title-3)', color: proxy?.LatencyMs > 2000 ? '#ea580c' : '#3FBF8F', marginTop: 2 }}>
                      {proxy?.LatencyMs != null ? `${proxy.LatencyMs} ms` : '—'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>
                      Từ VPS xuyên qua Proxy
                    </div>
                  </div>

                  <div style={{ padding: '10px 12px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                      Vượt rào Cổng VPA
                    </div>
                    <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-bold)', color: proxy?.VpaStatus === 'ok' ? '#3FBF8F' : (proxy?.VpaStatus === 'blocked_403' ? '#dc2626' : 'var(--text-strong)'), marginTop: 4 }}>
                      {proxy?.VpaStatus === 'ok' ? 'Thành công (200 OK)' : (proxy?.VpaStatus === 'blocked_403' ? 'Bị chặn (403 Cloudflare)' : (proxy?.VpaStatus || 'Chưa test'))}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>
                      Khả năng gọi API vpa.com.vn
                    </div>
                  </div>
                </div>

                {/* Thông báo lỗi nếu có */}
                {proxy?.ErrorMessage && (
                  <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(220, 38, 38, 0.08)', color: '#dc2626', fontSize: 12 }}>
                    Chi tiết: {proxy.ErrorMessage}
                  </div>
                )}

                {/* Ghi chú hướng dẫn proxy */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, background: 'var(--surface-sunken)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <Lightbulb size={14} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                  <span><b>Cơ chế hoạt động:</b> Toàn bộ module cào dữ liệu (`IVpaApiClient`) tự động định tuyến các lượt crawl danh sách biển tuần, biển tháng và kết quả đấu giá qua máy chủ proxy này. Khi proxy sống và có IP Việt Nam, VPA sẽ không chặn 403.</span>
                </div>
              </div>
            </div>
          </div>

          {/* BACKGROUND JOBS STATUS */}
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
            <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
                Tác vụ ngầm &amp; Bộ lập lịch (Background Worker Jobs)
              </span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                {jobs.length} tiến trình đang đăng ký
              </span>
            </div>

            <div style={{ padding: 'var(--gutter-card)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-2)' }}>
              {jobs.map((job) => (
                <div
                  key={job.jobName}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-sunken)',
                    border: '1px solid var(--border-hairline)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    font: 'var(--type-caption)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: job.status === 'ok' ? '#3FBF8F' : '#d97706', flexShrink: 0 }} />
                    <span style={{ fontWeight: 'var(--fw-medium)', color: 'var(--text-strong)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {job.jobName}
                    </span>
                  </div>
                  <span style={{ color: 'var(--text-faint)', fontSize: 11, flexShrink: 0 }}>
                    {job.lastRunAt ? new Date(job.lastRunAt).toLocaleTimeString('vi-VN') : 'Đang chờ'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
