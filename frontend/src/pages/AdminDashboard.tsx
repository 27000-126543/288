import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Progress,
  Space,
  Select,
  Button,
  List,
  Avatar,
  message,
} from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  RiseOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { adminAPI } from '../services/api';
import ReactECharts from 'echarts-for-react';

const { Option } = Select;

const AdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, [selectedMarket, selectedCategory]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getDashboard({
        market: selectedMarket || undefined,
        category: selectedCategory || undefined,
      });
      setDashboardData(data);
    } catch (error) {
      message.error('加载看板数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionChartOption = () => {
    if (!dashboardData?.transactionTrend) return {};
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['交易额', '订单量'] },
      xAxis: {
        type: 'category',
        data: dashboardData.transactionTrend.map((item: any) => item.date),
      },
      yAxis: [
        { type: 'value', name: '交易额(万元)' },
        { type: 'value', name: '订单量' },
      ],
      series: [
        {
          name: '交易额',
          type: 'bar',
          data: dashboardData.transactionTrend.map((item: any) => item.amount),
          itemStyle: { color: '#52c41a' },
        },
        {
          name: '订单量',
          type: 'line',
          yAxisIndex: 1,
          data: dashboardData.transactionTrend.map((item: any) => item.orders),
          smooth: true,
          lineStyle: { color: '#1890ff', width: 3 },
          itemStyle: { color: '#1890ff' },
        },
      ],
    };
  };

  const getPriceIndexChartOption = () => {
    if (!dashboardData?.priceIndex) return {};
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['蔬菜', '水果', '肉类', '水产'] },
      xAxis: {
        type: 'category',
        data: dashboardData.priceIndex.map((item: any) => item.date),
      },
      yAxis: { type: 'value', name: '价格指数' },
      series: [
        {
          name: '蔬菜',
          type: 'line',
          data: dashboardData.priceIndex.map((item: any) => item.vegetable),
          smooth: true,
        },
        {
          name: '水果',
          type: 'line',
          data: dashboardData.priceIndex.map((item: any) => item.fruit),
          smooth: true,
        },
        {
          name: '肉类',
          type: 'line',
          data: dashboardData.priceIndex.map((item: any) => item.meat),
          smooth: true,
        },
        {
          name: '水产',
          type: 'line',
          data: dashboardData.priceIndex.map((item: any) => item.aquatic),
          smooth: true,
        },
      ],
    };
  };

  const getCategorySalesChartOption = () => {
    if (!dashboardData?.categorySales) return {};
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', right: 10, top: 'center' },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          data: dashboardData.categorySales.map((item: any) => ({
            name: item.category,
            value: item.sales,
          })),
        },
      ],
    };
  };

  const inventoryColumns = [
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: '品类',
      dataIndex: 'category',
      key: 'category',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '当前库存',
      dataIndex: 'stock',
      key: 'stock',
      render: (text: number, record: any) => (
        <span style={{ color: text < record.minStock ? '#ff4d4f' : '#52c41a' }}>
          {text} 公斤
        </span>
      ),
    },
    {
      title: '最低库存',
      dataIndex: 'minStock',
      key: 'minStock',
      render: (text: number) => `${text} 公斤`,
    },
    {
      title: '预警级别',
      dataIndex: 'alertLevel',
      key: 'alertLevel',
      render: (level: string) => {
        const colors: Record<string, string> = {
          low: 'green',
          medium: 'orange',
          high: 'red',
        };
        return <Tag color={colors[level]}>{level === 'high' ? '紧急' : level === 'medium' ? '警告' : '正常'}</Tag>;
      },
    },
  ];

  const memberColumns = [
    {
      title: '会员',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Space>
          <Avatar>{text[0]}</Avatar>
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => {
        const colors: Record<string, string> = {
          normal: 'default',
          silver: 'blue',
          gold: 'gold',
          diamond: 'purple',
        };
        const names: Record<string, string> = {
          normal: '普通',
          silver: '银卡',
          gold: '金卡',
          diamond: '钻石',
        };
        return <Tag color={colors[level]}>{names[level]}</Tag>;
      },
    },
    {
      title: '年交易额',
      dataIndex: 'yearlyAmount',
      key: 'yearlyAmount',
      render: (text: number) => `¥${text.toLocaleString()}`,
    },
    {
      title: '活跃度',
      dataIndex: 'activity',
      key: 'activity',
      render: (text: number) => (
        <Progress percent={text} size="small" />
      ),
    },
    {
      title: '信用分',
      dataIndex: 'creditScore',
      key: 'creditScore',
      render: (text: number) => (
        <span style={{ color: text >= 80 ? '#52c41a' : text >= 60 ? '#faad14' : '#ff4d4f' }}>
          {text}
        </span>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="管理看板"
        loading={loading}
        extra={
          <Space>
            <Select
              placeholder="选择市场"
              style={{ width: 150 }}
              allowClear
              value={selectedMarket}
              onChange={setSelectedMarket}
            >
              <Option value="market1">市场A</Option>
              <Option value="market2">市场B</Option>
              <Option value="market3">市场C</Option>
            </Select>
            <Select
              placeholder="选择品类"
              style={{ width: 150 }}
              allowClear
              value={selectedCategory}
              onChange={setSelectedCategory}
            >
              <Option value="蔬菜">蔬菜</Option>
              <Option value="水果">水果</Option>
              <Option value="肉类">肉类</Option>
              <Option value="水产">水产</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={loadDashboardData}>
              刷新
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card>
              <Statistic
                title="今日交易额"
                value={dashboardData?.todayAmount || 0}
                precision={2}
                prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                suffix="万元"
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ marginTop: 8, color: '#52c41a', fontSize: 12 }}>
                <RiseOutlined /> 较昨日 +12.5%
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="今日订单数"
                value={dashboardData?.todayOrders || 0}
                prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
                suffix="单"
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ marginTop: 8, color: '#52c41a', fontSize: 12 }}>
                <RiseOutlined /> 较昨日 +8.3%
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="库存预警"
                value={dashboardData?.inventoryAlerts || 0}
                prefix={<WarningOutlined style={{ color: '#faad14' }} />}
                suffix="个"
                valueStyle={{ color: '#faad14' }}
              />
              <div style={{ marginTop: 8, color: '#ff4d4f', fontSize: 12 }}>
                其中紧急预警 {dashboardData?.highAlerts || 0} 个
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="检测合格率"
                value={dashboardData?.inspectionRate || 0}
                precision={1}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                suffix="%"
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
                共检测 {dashboardData?.totalInspections || 0} 批次
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={16}>
            <Card title="交易额与订单量趋势">
              <div style={{ height: 300 }}>
                <ReactECharts option={getTransactionChartOption()} style={{ height: '100%' }} />
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="品类销售占比">
              <div style={{ height: 300 }}>
                <ReactECharts option={getCategorySalesChartOption()} style={{ height: '100%' }} />
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Card title="价格指数走势">
              <div style={{ height: 280 }}>
                <ReactECharts option={getPriceIndexChartOption()} style={{ height: '100%' }} />
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="会员活跃度排行">
              <List
                dataSource={dashboardData?.activeMembers || []}
                renderItem={(item: any) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar>{item.name[0]}</Avatar>}
                      title={
                        <Space>
                          <span>{item.name}</span>
                          <Tag color={item.level === 'diamond' ? 'purple' : item.level === 'gold' ? 'gold' : item.level === 'silver' ? 'blue' : 'default'}>
                            {item.level === 'diamond' ? '钻石' : item.level === 'gold' ? '金卡' : item.level === 'silver' ? '银卡' : '普通'}
                          </Tag>
                        </Space>
                      }
                      description={`交易额：¥${item.yearlyAmount?.toLocaleString()} | 活跃度：${item.activity}%`}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card title="库存预警列表">
              <Table
                columns={inventoryColumns}
                dataSource={dashboardData?.inventoryList || []}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 5 }}
              />
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default AdminDashboard;
