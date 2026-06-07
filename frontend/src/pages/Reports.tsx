import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  Button,
  DatePicker,
  Table,
  Statistic,
  Space,
  Tag,
  message,
  Progress,
} from 'antd';
import {
  DownloadOutlined,
  BarChartOutlined,
  DollarOutlined,
  TruckOutlined,
  CheckCircleOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { reportAPI } from '../services/api';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    loadReportData();
  }, [selectedMonth, selectedCategory]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const { data } = await reportAPI.getMonthlyReport({
        month: selectedMonth,
        category: selectedCategory || undefined,
      });
      setReportData(data);
    } catch (error) {
      message.error('加载报表数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await reportAPI.exportMonthlyReport({
        month: selectedMonth,
        category: selectedCategory || undefined,
      }, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `交易报表_${selectedMonth}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      message.success('报表导出成功');
    } catch (error) {
      message.error('报表导出失败');
    } finally {
      setExporting(false);
    }
  };

  const getSalesChartOption = () => {
    if (!reportData?.categorySales) return {};
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['销售额', '订单量'] },
      xAxis: {
        type: 'category',
        data: reportData.categorySales.map((item: any) => item.category),
      },
      yAxis: [
        { type: 'value', name: '销售额(万元)' },
        { type: 'value', name: '订单量' },
      ],
      series: [
        {
          name: '销售额',
          type: 'bar',
          data: reportData.categorySales.map((item: any) => item.sales),
          itemStyle: { color: '#52c41a' },
        },
        {
          name: '订单量',
          type: 'line',
          yAxisIndex: 1,
          data: reportData.categorySales.map((item: any) => item.orders),
          smooth: true,
          lineStyle: { color: '#1890ff', width: 3 },
        },
      ],
    };
  };

  const getPriceFluctuationChartOption = () => {
    if (!reportData?.priceFluctuation) return {};
    const categories = Object.keys(reportData.priceFluctuation);
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: categories },
      xAxis: {
        type: 'category',
        data: reportData.priceFluctuation[categories[0]]?.map((_: any, i: number) => `第${i + 1}周`),
      },
      yAxis: { type: 'value', name: '价格指数' },
      series: categories.map((cat) => ({
        name: cat,
        type: 'line',
        data: reportData.priceFluctuation[cat],
        smooth: true,
      })),
    };
  };

  const columns = [
    {
      title: '品类',
      dataIndex: 'category',
      key: 'category',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '销售额(万元)',
      dataIndex: 'sales',
      key: 'sales',
      render: (text: number) => text.toFixed(2),
      sorter: (a: any, b: any) => a.sales - b.sales,
    },
    {
      title: '订单量',
      dataIndex: 'orders',
      key: 'orders',
      sorter: (a: any, b: any) => a.orders - b.orders,
    },
    {
      title: '平均价格(元/公斤)',
      dataIndex: 'avgPrice',
      key: 'avgPrice',
      render: (text: number) => text.toFixed(2),
    },
    {
      title: '价格波动(%)',
      dataIndex: 'priceChange',
      key: 'priceChange',
      render: (text: number) => (
        <span style={{ color: text > 0 ? '#ff4d4f' : '#52c41a' }}>
          {text > 0 ? '+' : ''}{text.toFixed(2)}%
        </span>
      ),
    },
    {
      title: '物流成本(万元)',
      dataIndex: 'logisticsCost',
      key: 'logisticsCost',
      render: (text: number) => text.toFixed(2),
    },
    {
      title: '检测合格率(%)',
      dataIndex: 'inspectionRate',
      key: 'inspectionRate',
      render: (text: number) => (
        <Progress percent={text} size="small" />
      ),
    },
    {
      title: '客户满意度',
      dataIndex: 'satisfaction',
      key: 'satisfaction',
      render: (text: number) => (
        <span>
          <StarOutlined style={{ color: '#faad14' }} /> {text.toFixed(1)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="月度交易报表"
        loading={loading}
        extra={
          <Space>
            <Select
              placeholder="选择月份"
              style={{ width: 150 }}
              value={selectedMonth}
              onChange={setSelectedMonth}
            >
              {Array.from({ length: 12 }, (_, i) => {
                const month = dayjs().subtract(i, 'month').format('YYYY-MM');
                return (
                  <Option key={month} value={month}>
                    {dayjs(month).format('YYYY年MM月')}
                  </Option>
                );
              })}
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
            <RangePicker
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            />
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={exporting}
              onClick={handleExport}
            >
              导出Excel
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总销售额"
                value={reportData?.totalSales || 0}
                precision={2}
                prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                suffix="万元"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总订单数"
                value={reportData?.totalOrders || 0}
                prefix={<BarChartOutlined style={{ color: '#1890ff' }} />}
                suffix="单"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="物流总成本"
                value={reportData?.totalLogisticsCost || 0}
                precision={2}
                prefix={<TruckOutlined style={{ color: '#faad14' }} />}
                suffix="万元"
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均检测合格率"
                value={reportData?.avgInspectionRate || 0}
                precision={1}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                suffix="%"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Card title="各品类销售统计">
              <div style={{ height: 300 }}>
                <ReactECharts option={getSalesChartOption()} style={{ height: '100%' }} />
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="价格波动趋势">
              <div style={{ height: 300 }}>
                <ReactECharts option={getPriceFluctuationChartOption()} style={{ height: '100%' }} />
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card title="各品类详细数据">
              <Table
                columns={columns}
                dataSource={reportData?.categorySales || []}
                rowKey="category"
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Card title="物流成本分析">
              <Table
                columns={[
                  { title: '物流类型', dataIndex: 'type', key: 'type' },
                  { title: '订单数', dataIndex: 'orders', key: 'orders' },
                  { title: '成本(万元)', dataIndex: 'cost', key: 'cost', render: (v: number) => v.toFixed(2) },
                  { title: '占比', dataIndex: 'percentage', key: 'percentage', render: (v: number) => `${v}%` },
                ]}
                dataSource={reportData?.logisticsAnalysis || []}
                rowKey="type"
                size="small"
                pagination={false}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="客户满意度分析">
              <Table
                columns={[
                  { title: '评分等级', dataIndex: 'rating', key: 'rating' },
                  { title: '订单数', dataIndex: 'count', key: 'count' },
                  { title: '占比', dataIndex: 'percentage', key: 'percentage', render: (v: number) => `${v}%` },
                ]}
                dataSource={reportData?.satisfactionAnalysis || []}
                rowKey="rating"
                size="small"
                pagination={false}
              />
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Reports;
