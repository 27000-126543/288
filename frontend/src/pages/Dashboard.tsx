import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Button, Progress, Avatar } from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  ShoppingOutlined,
  InboxOutlined,
  BellOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { productAPI, orderAPI, inventoryAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import ReactECharts from 'echarts-for-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>({
    totalOrders: 0,
    totalAmount: 0,
    totalProducts: 0,
    inventoryAlerts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ordersRes, productsRes, recommendationsRes] = await Promise.all([
        orderAPI.getOrders({ limit: 5 }),
        productAPI.getProducts({ limit: 5 }),
        productAPI.getRecommendations(),
      ]);
      setRecentOrders(ordersRes.data.orders || []);
      setStats((prev: any) => ({
        ...prev,
        totalOrders: ordersRes.data.total || 0,
        totalProducts: productsRes.data.total || 0,
      }));
      setRecommendations(recommendationsRes.data || []);
    } catch (error) {
      console.error('加载数据失败', error);
    }
  };

  const chartOption = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    },
    yAxis: { type: 'value' },
    series: [{
      data: [820, 932, 901, 934, 1290, 1330, 1320],
      type: 'line',
      smooth: true,
      areaStyle: { color: 'rgba(82, 196, 26, 0.1)' },
      lineStyle: { color: '#52c41a' },
      itemStyle: { color: '#52c41a' },
    }],
  };

  const orderStatusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'gold', text: '待确认' },
    confirmed: { color: 'blue', text: '已确认' },
    shipped: { color: 'cyan', text: '配送中' },
    delivered: { color: 'green', text: '已完成' },
    cancelled: { color: 'red', text: '已取消' },
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="订单总数"
              value={stats.totalOrders}
              prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="交易总额"
              value={stats.totalAmount || 128560}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="在售商品"
              value={stats.totalProducts}
              prefix={<ShoppingOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="库存预警"
              value={stats.inventoryAlerts || 3}
              prefix={<InboxOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={16}>
          <Card title="交易趋势" extra={<Button type="link" size="small">查看详情</Button>}>
            <ReactECharts option={chartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="智能推荐" extra={<Button type="link" size="small" onClick={() => navigate('/products')}>更多</Button>}>
            <List
              dataSource={recommendations.slice(0, 5)}
              renderItem={(item: any) => (
              <List.Item
                style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
                onClick={() => navigate(`/products/${item.product._id}`)}
              >
                <List.Item.Meta
                  avatar={<Avatar style={{ backgroundColor: '#52c41a' }}>{item.product.name[0]}</Avatar>}
                  title={
                    <div>
                      <span>{item.product.name}</span>
                      <Tag color="green" style={{ marginLeft: 8 }}>推荐</Tag>
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ color: '#fa8c16', fontWeight: 'bold' }}>¥{item.product.price}/{item.product.unit}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>{item.reason}</div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="最近订单" extra={<Button type="link" size="small" onClick={() => navigate('/orders')}>全部订单</Button>}>
            <List
              dataSource={recentOrders}
              renderItem={(item: any) => (
                <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{item.orderNo}</span>
                        <Tag color={orderStatusMap[item.status]?.color}>
                          {orderStatusMap[item.status]?.text}
                        </Tag>
                      </div>
                    }
                    description={
                      <div>
                        <span>共{item.items?.length || 0}件商品</span>
                        <span style={{ marginLeft: 16, color: '#fa8c16' }}>¥{item.totalAmount?.toFixed(2)}</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="待办提醒" extra={<Tag icon={<BellOutlined />} color="red">3 项待处理</Tag>}>
            <List>
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar style={{ backgroundColor: '#fa8c16' }}>!</Avatar>}
                  title="库存不足预警"
                  description="有3个商品库存低于安全线，请及时补货"
                />
              </List.Item>
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar style={{ backgroundColor: '#faad14' }}>!</Avatar>}
                  title="还款提醒"
                  description="订单ORD202401001将于3天后到期，金额¥5,000"
                />
              </List.Item>
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar style={{ backgroundColor: '#52c41a' }}>✓</Avatar>}
                  title="会员升级"
                  description="您距离银卡会员还差¥50,000交易额"
                />
              </List.Item>
            </List>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
