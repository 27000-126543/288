import { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Button,
  Spin,
  message,
  Steps,
  Divider,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (id) loadOrder();
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const { data } = await orderAPI.getOrder(id!);
      setOrder(data);
    } catch (error) {
      message.error('加载订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!order) {
    return <div>订单不存在</div>;
  }

  const orderStatusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'gold', text: '待确认' },
    confirmed: { color: 'blue', text: '已确认' },
    shipped: { color: 'cyan', text: '配送中' },
    delivered: { color: 'green', text: '已完成' },
    cancelled: { color: 'red', text: '已取消' },
  };

  const paymentStatusMap: Record<string, { color: string; text: string }> = {
    unpaid: { color: 'orange', text: '待付款' },
    paid: { color: 'green', text: '已付款' },
    overdue: { color: 'red', text: '已逾期' },
  };

  const logisticsMap: Record<string, string> = {
    full_truck: '整车运输',
    ltl: '零担物流',
  };

  const steps: { title: string; status: 'wait' | 'finish' }[] = [
    { title: '提交订单', status: 'finish' },
    { title: '商户确认', status: ['pending', 'confirmed', 'shipped', 'delivered'].includes(order.status) ? 'finish' : 'wait' },
    { title: '商品配送', status: ['shipped', 'delivered'].includes(order.status) ? 'finish' : 'wait' },
    { title: '确认收货', status: order.status === 'delivered' ? 'finish' : 'wait' },
  ];

  const columns = [
    { title: '商品名称', dataIndex: 'productName', key: 'productName' },
    { title: '规格', dataIndex: 'specification', key: 'specification' },
    { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', render: (val: number) => `¥${val?.toFixed(2)}` },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '小计', dataIndex: 'subtotal', key: 'subtotal', render: (val: number) => <span style={{ color: '#fa8c16' }}>¥{val?.toFixed(2)}</span> },
  ];

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        返回列表
      </Button>

      <Card title={`订单详情 - ${order.orderNo}`} extra={<Tag color={orderStatusMap[order.status]?.color}>{orderStatusMap[order.status]?.text}</Tag>}>
        <Steps current={steps.findIndex(s => s.status === 'wait') > 0 ? steps.findIndex(s => s.status === 'wait') - 1 : 3} items={steps} style={{ marginBottom: 24 }} />

        <Divider />

        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="订单号">{order.orderNo}</Descriptions.Item>
          <Descriptions.Item label="下单时间">{new Date(order.createdAt).toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="采购商">{order.wholesalerId?.companyName || order.wholesalerId?.username}</Descriptions.Item>
          <Descriptions.Item label="供应商">{order.merchantId?.companyName || order.merchantId?.username}</Descriptions.Item>
          <Descriptions.Item label="配送地址">{order.deliveryAddress}</Descriptions.Item>
          <Descriptions.Item label="发货仓库">{order.warehouse}</Descriptions.Item>
          <Descriptions.Item label="物流方式">{logisticsMap[order.logisticsType]}</Descriptions.Item>
          <Descriptions.Item label="物流费">¥{order.logisticsCost?.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="付款状态">
            <Tag color={paymentStatusMap[order.paymentStatus]?.color}>
              {paymentStatusMap[order.paymentStatus]?.text}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="使用信用">¥{order.creditUsed?.toFixed(2)}</Descriptions.Item>
          {order.paymentDueDate && (
            <Descriptions.Item label="还款截止日">
              {new Date(order.paymentDueDate).toLocaleDateString()}
            </Descriptions.Item>
          )}
        </Descriptions>

        <Divider orientation="left">商品清单</Divider>
        <Table columns={columns} dataSource={order.items} rowKey="productId" pagination={false} />

        <div style={{ textAlign: 'right', marginTop: 24 }}>
          <p style={{ fontSize: 16 }}>
            商品总额：<span style={{ color: '#fa8c16', fontWeight: 'bold' }}>¥{order.totalAmount?.toFixed(2)}</span>
          </p>
          <p style={{ fontSize: 16 }}>
            物流费用：<span style={{ color: '#fa8c16', fontWeight: 'bold' }}>¥{order.logisticsCost?.toFixed(2)}</span>
          </p>
          <p style={{ fontSize: 20, fontWeight: 'bold', color: '#fa8c16' }}>
            应付总额：¥{(order.totalAmount + order.logisticsCost)?.toFixed(2)}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default OrderDetail;
