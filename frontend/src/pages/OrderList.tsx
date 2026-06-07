import { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Tag,
  Button,
  Select,
  Space,
  message,
  Popconfirm,
} from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

const { Option } = Select;

const OrderList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadOrders();
  }, [page, status]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data } = await orderAPI.getOrders({
      page, limit: pageSize, status });
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (error) {
      message.error('加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await orderAPI.updateOrderStatus(id, newStatus);
      message.success('状态更新成功');
      loadOrders();
    } catch (error) {
      message.error('更新失败');
    }
  };

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

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (text: string) => <a onClick={() => navigate(`/orders/${text}`)}>{text}</a>,
    },
    {
      title: '商品信息',
      dataIndex: 'items',
      key: 'items',
      render: (items: any[]) => (
        <div>
          {items?.slice(0, 2).map((item, idx) => (
          <div key={idx} style={{ fontSize: 12 }}>
            {item.productName} x {item.quantity}
          </div>
        ))}
        {items?.length > 2 && <div style={{ fontSize: 12, color: '#999' }}>等{items.length}件商品</div>}
      </div>
    ),
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (val: number) => <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>¥{val?.toFixed(2)}</span>,
    },
    {
      title: '物流费',
      dataIndex: 'logisticsCost',
      key: 'logisticsCost',
      render: (val: number) => `¥${val?.toFixed(2)}`,
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={orderStatusMap[status]?.color}>
          {orderStatusMap[status]?.text}
        </Tag>
      ),
    },
    {
      title: '付款状态',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string) => (
        <Tag color={paymentStatusMap[status]?.color}>
          {paymentStatusMap[status]?.text}
        </Tag>
      ),
    },
    {
      title: '下单时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/orders/${record._id}`)}>
            详情
          </Button>
          {user?.role === 'merchant' && record.status === 'pending' && (
            <>
              <Popconfirm title="确认接受订单？" onConfirm={() => handleUpdateStatus(record._id, 'confirmed')}>
                <Button type="link" icon={<CheckOutlined />}>接受</Button>
              </Popconfirm>
              <Popconfirm title="拒绝订单？" onConfirm={() => handleUpdateStatus(record._id, 'cancelled')}>
                <Button type="link" danger icon={<CloseOutlined />}>拒绝</Button>
              </Popconfirm>
            </>
          )}
          {user?.role === 'merchant' && record.status === 'confirmed' && (
            <Popconfirm title="确认发货？" onConfirm={() => handleUpdateStatus(record._id, 'shipped')}>
              <Button type="link">发货</Button>
            </Popconfirm>
          )}
          {user?.role === 'wholesaler' && record.status === 'shipped' && (
            <Popconfirm title="确认收货？" onConfirm={() => handleUpdateStatus(record._id, 'delivered')}>
              <Button type="link">确认收货</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="订单管理"
        extra={
          <Select
            placeholder="筛选状态"
            style={{ width: 150 }}
            allowClear
            value={status}
            onChange={(value) => {
              setStatus(value || '');
              setPage(1);
            }}
          >
            <Option value="pending">待确认</Option>
            <Option value="confirmed">已确认</Option>
            <Option value="shipped">配送中</Option>
            <Option value="delivered">已完成</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
        }
      >
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: setPage,
          }}
        />
      </Card>
    </div>
  );
};

export default OrderList;
