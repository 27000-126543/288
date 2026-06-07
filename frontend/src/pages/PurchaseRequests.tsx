import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Space,
  List,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, EyeOutlined, BulbOutlined } from '@ant-design/icons';
import { productAPI } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

const categories = ['蔬菜', '水果', '肉类', '水产', '粮油', '干货'];
const units = ['公斤', '吨', '箱', '件'];

const PurchaseRequests = () => {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data } = await productAPI.getPurchaseRequests();
      setRequests(data || []);
    } catch (error) {
      message.error('加载求购信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await productAPI.createPurchaseRequest(values);
      message.success('求购信息发布成功');
      setModalVisible(false);
      form.resetFields();
      loadRequests();
    } catch (error: any) {
      message.error(error.response?.data?.message || '发布失败');
    }
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    open: { color: 'green', text: '进行中' },
    matched: { color: 'blue', text: '已匹配' },
    closed: { color: 'gray', text: '已关闭' },
  };

  const columns = [
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: '品类',
      dataIndex: 'category',
      key: 'category',
      render: (val: string) => <Tag color="blue">{val}</Tag>,
    },
    {
      title: '采购数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (val: number, record: any) => `${val} ${record.unit}`,
    },
    {
      title: '期望价格',
      dataIndex: 'expectedPrice',
      key: 'expectedPrice',
      render: (val: number) => <span style={{ color: '#fa8c16' }}>¥{val?.toFixed(2)}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>
      ),
    },
    {
      title: '发布时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '匹配商品数',
      dataIndex: 'matchedProducts',
      key: 'matchedCount',
      render: (products: any[]) => <Tag color="green">{products?.length || 0}个</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />}>
            查看匹配
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="求购信息管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            发布求购
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={requests}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          expandedRowRender={(record) => (
            <Card size="small" title="匹配的商品">
              <List
                grid={{ gutter: 16, column: 4 }}
                dataSource={record.matchedProducts}
                renderItem={(product: any) => (
                  <List.Item>
                    <Card hoverable size="small">
                      <div style={{ textAlign: 'center', fontSize: 32, marginBottom: 8 }}>🥬</div>
                      <div style={{ fontWeight: 'bold' }}>{product.name}</div>
                      <div style={{ color: '#fa8c16' }}>¥{product.price}/{product.unit}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>库存：{product.stock}</div>
                    </Card>
                  </List.Item>
                )}
              />
            </Card>
          )}
        />
      </Card>

      <Modal
        title="发布求购信息"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="productName"
                label="商品名称"
                rules={[{ required: true, message: '请输入商品名称' }]}
              >
                <Input placeholder="例如：有机大白菜" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="商品品类"
                rules={[{ required: true, message: '请选择品类' }]}
              >
                <Select placeholder="请选择品类">
                  {categories.map(cat => (
                    <Option key={cat} value={cat}>{cat}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="quantity"
                label="采购数量"
                rules={[{ required: true, message: '请输入数量' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="unit"
                label="单位"
                rules={[{ required: true, message: '请选择单位' }]}
              >
                <Select placeholder="选择单位">
                  {units.map(u => (
                    <Option key={u} value={u}>{u}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="expectedPrice"
                label="期望单价"
                rules={[{ required: true, message: '请输入期望价格' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} prefix="¥" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="补充说明">
            <TextArea rows={3} placeholder="请输入规格要求、收货地点等补充信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PurchaseRequests;
