import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  Button,
  Tag,
  List,
  message,
  Space,
  Statistic,
  Alert,
} from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  MinusOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { adminAPI } from '../services/api';
import ReactECharts from 'echarts-for-react';

const { Option } = Select;

const PriceForecast = () => {
  const [loading, setLoading] = useState(false);
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedForecast, setSelectedForecast] = useState<any>(null);

  useEffect(() => {
    loadForecasts();
  }, [selectedCategory]);

  const loadForecasts = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getPriceForecast({
        category: selectedCategory || undefined,
        days: 7,
      });
      setForecasts(data || []);
      if (data?.length > 0) {
        setSelectedForecast(data[0]);
      }
    } catch (error) {
      message.error('加载价格预测失败');
    } finally {
      setLoading(false);
    }
  };

  const getChartOption = (forecast: any) => {
    if (!forecast) return {};
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['预测价格', '置信区间下限', '置信区间上限'] },
      xAxis: {
        type: 'category',
        data: forecast.forecast?.map((f: any) =>
          new Date(f.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
        ),
      },
      yAxis: { type: 'value', name: '价格(元)' },
      series: [
        {
          name: '预测价格',
          type: 'line',
          data: forecast.forecast?.map((f: any) => f.predictedPrice),
          smooth: true,
          lineStyle: { color: '#52c41a', width: 3 },
          itemStyle: { color: '#52c41a' },
        },
        {
          name: '置信区间下限',
          type: 'line',
          data: forecast.forecast?.map((f: any) => f.lowerBound),
          lineStyle: { type: 'dashed', color: '#999' },
          itemStyle: { color: '#999' },
        },
        {
          name: '置信区间上限',
          type: 'line',
          data: forecast.forecast?.map((f: any) => f.upperBound),
          lineStyle: { type: 'dashed', color: '#999' },
          itemStyle: { color: '#999' },
        },
      ],
    };
  };

  const getActionInfo = (action: string) => {
    switch (action) {
      case 'buy':
        return { icon: <RiseOutlined />, color: '#ff4d4f', text: '建议尽早采购' };
      case 'wait':
        return { icon: <FallOutlined />, color: '#52c41a', text: '建议观望等待' };
      default:
        return { icon: <MinusOutlined />, color: '#faad14', text: '建议按需采购' };
    }
  };

  return (
    <div>
      <Card
        title="价格走势预测"
        extra={
          <Space>
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
            <Button onClick={loadForecasts}>刷新预测</Button>
          </Space>
        }
      >
        <Row gutter={16}>
          <Col span={6}>
            <Card title="热门商品预测" size="small" bodyStyle={{ padding: 0 }}>
              <List
                dataSource={forecasts}
                renderItem={(item: any) => (
                  <List.Item
                    style={{
                      cursor: 'pointer',
                      background: selectedForecast?.productId === item.productId ? '#e6f7ff' : 'transparent',
                      padding: 12,
                    }}
                    onClick={() => setSelectedForecast(item)}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <span style={{ fontWeight: 'bold' }}>{item.productName}</span>
                          <Tag color="blue">{item.category}</Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <div>当前价格：<span style={{ color: '#fa8c16' }}>¥{item.currentPrice}</span></div>
                          <div style={{
                            color: getActionInfo(item.recommendation?.action).color,
                          }}>
                            {getActionInfo(item.recommendation?.action).icon} {item.recommendation?.message}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col span={18}>
            {selectedForecast ? (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Card title={`${selectedForecast.productName} - 未来7天价格预测`}>
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title="当前价格"
                      value={selectedForecast.currentPrice}
                      precision={2}
                      prefix="¥"
                      suffix="/公斤"
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="预测均价"
                      value={selectedForecast.avgPredictedPrice}
                      precision={2}
                      prefix="¥"
                      suffix="/公斤"
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="价格波动"
                      value={selectedForecast.priceChange}
                      precision={2}
                      prefix={selectedForecast.priceTrend === 'up' ? '+' : ''}
                      suffix="%"
                      valueStyle={{ color: selectedForecast.priceTrend === 'up' ? '#ff4d4f' : '#52c41a' }}
                    />
                  </Col>
                </Row>
                <div style={{ height: 350, marginTop: 20 }}>
                  <ReactECharts option={getChartOption(selectedForecast)} style={{ height: '100%' }} />
                </div>
              </Card>

              <Alert
                message="采购建议"
                description={
                  <div>
                    <p style={{ fontWeight: 'bold', marginBottom: 8 }}>
                      {getActionInfo(selectedForecast.recommendation?.action).icon}{' '}
                      {getActionInfo(selectedForecast.recommendation?.action).text}
                    </p>
                    <p>{selectedForecast.recommendation?.message}</p>
                    <p style={{ color: '#666', fontSize: 12 }}>
                      置信度：{selectedForecast.confidence}%
                    </p>
                  </div>
                }
                type={selectedForecast.recommendation?.action === 'buy' ? 'warning' : selectedForecast.recommendation?.action === 'wait' ? 'success' : 'info'}
                showIcon
              />

              <Card title="影响因素分析" size="small">
                <Row gutter={16}>
                  <Col span={8}>
                    <Space>
                      <CalendarOutlined style={{ color: '#1890ff' }} />
                      <span>季节因素：{selectedForecast.factors?.season || '正常季节波动'}</span>
                    </Space>
                  </Col>
                  <Col span={8}>
                    <Space>
                      <ThunderboltOutlined style={{ color: '#faad14' }} />
                      <span>天气影响：{selectedForecast.factors?.weather || '天气正常'}</span>
                    </Space>
                  </Col>
                  <Col span={8}>
                    <Space>
                      <CalendarOutlined style={{ color: '#722ed1' }} />
                      <span>节假日：{selectedForecast.factors?.holiday || '无'}</span>
                    </Space>
                  </Col>
                </Row>
              </Card>
            </Space>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                请从左侧选择一个商品查看价格预测
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </Card>
  </div>
  );
};

export default PriceForecast;