import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Result, Button, Spin, message as antdMessage } from 'antd';
import { API } from '../../../../config/apiEndpoints';
import apiClient from '../../../../services/apiClient';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const proxyIpnCall = async () => {
      const ipnData: Record<string, any> = {};
      for (const [key, value] of searchParams.entries()) {
        ipnData[key] = value;
      }

      const { orderId, signature, resultCode, message } = ipnData;

      if (!orderId || !signature || typeof resultCode === 'undefined') {
        setErrorMessage('Dữ liệu thanh toán không đầy đủ hoặc không hợp lệ.');
        setStatus('error');
        setLoading(false);
        return;
      }

      try {
        await apiClient.post(API.Payment.MOMO_IPN_PROXY, ipnData);

        const resultCodeNumber = Number(resultCode);
        if (resultCodeNumber === 0) {
          setStatus('success');
          antdMessage.success('Thanh toán thành công! Đơn hàng đã được cập nhật.');
        } else {
          setErrorMessage(message || 'Giao dịch không thành công (MoMo báo lỗi).');
          setStatus('error');
        }
      } catch (err: any) {
        const backendError =
          err.response?.data?.message || 'Có lỗi xảy ra khi xác thực giao dịch với máy chủ.';
        setErrorMessage(backendError);
        setStatus('error');
        antdMessage.error(backendError);
      } finally {
        setLoading(false);
      }
    };

    proxyIpnCall();
  }, [searchParams]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Spin size="large" />
        <p style={{ marginTop: 20 }}>Đang xác nhận thanh toán, vui lòng chờ...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <Result
        status="error"
        title="Thanh toán thất bại"
        subTitle={errorMessage || 'Giao dịch thất bại.'}
        extra={[
          <Button type="primary" key="back" onClick={() => navigate('/staff/sti-management')}>
            Về trang quản lý đơn hàng
          </Button>,
        ]}
      />
    );
  }

  return (
    <Result
      status="success"
      title="Thanh toán thành công!"
      subTitle={`Mã giao dịch MoMo: ${searchParams.get('transId') || 'Không rõ'}. Đơn hàng của bạn đã được cập nhật.`}
      extra={[
        <Button type="primary" key="back" onClick={() => navigate('/staff/sti-management')}>
          Về trang quản lý đơn hàng
        </Button>,
      ]}
    />
  );
};

export default PaymentSuccessPage;
