import { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Space,
  InputNumber,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, EyeOutlined, QrcodeOutlined } from '@ant-design/icons';
import { inspectionAPI } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const Inspection = () => {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [traceModalVisible, setTraceModalVisible] = useState(false);
  const [traceResult, setTraceResult] = useState<any>(null);
  const [traceCode, setTraceCode] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const { data } = await inspectionAPI.getReports();
      setReports(data || []);
    } catch (error) {
      message.error('加载检测报告失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      values.inspectionDate = values.inspectionDate?.toDate();
      await inspectionAPI.createReport(values);
      message.success('检测报告上传成功');
      setModalVisible(false);
      form.resetFields();
      loadReports();
    } catch (error: any) {
      message.error(error.response?.data?.message || '上传失败');
    }
  };

  const handleTrace = async () => {
    if (!traceCode) {
      message.warning('请输入追溯码');
      return;
    }
    try {
      const { data } = await inspectionAPI.getByTraceCode(traceCode);
      setTraceResult(data);
    } catch (error) {
      message.error('未找到该追溯码');
      setTraceResult(null);
    }
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    passed: { color: 'green', text: '合格' },
    pending: { color: 'gold', text: '待审核' },
    failed: { color: 'red', text: '不合格' },
  };

  const columns = [
    { title: '报告编号', dataIndex: 'reportNumber', key: 'reportNumber' },
    {
      title: '商品名称',
      dataIndex: ['productId', 'name'],
      key: 'productName',
    },
    {
      title: '商品品类',
      dataIndex: ['productId', 'category'],
      key: 'category',
      render: (val: string) => <Tag color="blue">{val}</Tag>,
    },
    { title: '检测机构', dataIndex: 'inspectionAgency', key: 'inspectionAgency' },
    {
      title: '检测日期',
      dataIndex: 'inspectionDate',
      key: 'inspectionDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '检测结果',
      dataIndex: 'overallResult',
      key: 'overallResult',
      render: (status: string) => (
        <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>
      ),
    },
    {
      title: '追溯码',
      dataIndex: 'traceCode',
      key: 'traceCode',
      render: (code: string) => (
        <Tag icon={<QrcodeOutlined />} color="green">{code}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />}>查看详情</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="食品安全检测管理"
        extra={
          <Space>
            <Button onClick={() => setTraceModalVisible(true)}>
              <QrcodeOutlined /> 追溯查询
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              上传检测报告
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={reports}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="上传检测报告"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="productId"
                label="关联商品ID"
                rules={[{ required: true, message: '请输入商品ID' }]}
              >
                <Input placeholder="请输入商品ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="reportNumber"
                label="报告编号"
                rules={[{ required: true, message: '请输入报告编号' }]}
              >
                <Input placeholder="请输入检测报告编号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="inspectionAgency"
                label="检测机构"
                rules={[{ required: true, message: '请输入检测机构' }]}
              >
                <Input placeholder="请输入检测机构名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="inspectionDate"
                label="检测日期"
                rules={[{ required: true, message: '请选择检测日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="overallResult"
            label="检测结论"
            rules={[{ required: true, message: '请选择检测结论' }]}
          >
            <Select placeholder="请选择检测结论">
              <Option value="passed">合格</Option>
              <Option value="failed">不合格</Option>
              <Option value="pending">待审核</Option>
            </Select>
          </Form.Item>
          <Form.Item name="reportUrl" label="检测报告附件">
            <Input placeholder="请上传报告文件或输入链接" />
          </Form.Item>
          <Form.Item label="检测项目明细">
            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <p style={{ fontSize: 12, color: '#999' }}>示例：农药残留、重金属、微生物等检测项目结果</p>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="食品安全追溯查询"
        open={traceModalVisible}
        onOk={handleTrace}
        onCancel={() => {
          setTraceModalVisible(false);
          setTraceResult(null);
          setTraceCode('');
        }}
        okText="查询"
        width={600}
      >
        <Input.Search
          placeholder="请输入追溯码"
          value={traceCode}
          onChange={(e) => setTraceCode(e.target.value)}
          onSearch={handleTrace}
          enterButton
          style={{ marginBottom: 16 }}
        />
        {traceResult && (
          <Card size="small" title="追溯信息">
            <p><strong>商品名称：</strong>{traceResult.productId?.name}</p>
            <p><strong>商品品类：</strong>{traceResult.productId?.category}</p>
            <p><strong>产地：</strong>{traceResult.productId?.origin}</p>
            <p><strong>供应商：</strong>{traceResult.merchantId?.companyName}</p>
            <p><strong>检测机构：</strong>{traceResult.inspectionAgency}</p>
            <p><strong>检测日期：</strong>{new Date(traceResult.inspectionDate).toLocaleDateString()}</p>
            <p>
              <strong>检测结果：</strong>
              <Tag color={statusMap[traceResult.overallResult]?.color}>
                {statusMap[traceResult.overallResult]?.text}
              </Tag>
            </p>
            <div>
              <strong>检测项目：</strong>
              {traceResult.items?.map((item: any, idx: number) => (
                <Tag key={idx} style={{ margin: 4 }}>
                  {item.name}: {item.result}
                </Tag>
              ))}
            </div>
          </Card>
        )}
      </Modal>
    </div>
  );
};

export default Inspection;
