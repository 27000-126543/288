import { useState } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  Row,
  Col,
  message,
  Space,
  List,
  Tag,
  Divider,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { productAPI, orderAPI } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

const CreateOrder = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [logisticsRecommendations, setLogisticsRecommendations] = useState<any[]>([]);
  const [selectedLogistics, setSelectedLogistics] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearchProducts = async (value: string) => {
    if (value) {
      try {
        const { data } = await productAPI.getProducts({ search: value, limit: 10 });
        setProducts(data.products || []);
      } catch (error) {
        message.error('搜索商品失败');
      }
    }
  };

  const addItem = (product: any) => {
    if (items.find((i: any) => i.productId === product._id)) {
      message.warning('该商品已添加');
      return;
    }
    setItems([...items, {
      productId: product._id,
      productName: product.name,
      price: product.price,
      unit: product.unit,
      specification: product.specifications?.[0] || '',
      quantity: 1,
      specifications: product.specifications || [],
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCalculateLogistics = async () => {
    if (items.length === 0) {
      message.warning('请先添加商品');
      return;
    }
    try {
      const { data } = await orderAPI.getLogisticsRecommendations({
        productIds: items.map(i => i.productId),
        quantities: items.map(i => i.quantity),
      });
      setLogisticsRecommendations(data.recommendations || []);
      if (data.recommendations?.length) {
        setSelectedLogistics(data.recommendations[0].type);
      }
      message.success('物流方案计算完成');
    } catch (error) {
      message.error('计算物流方案失败');
    }
  };

  const handleSubmit = async (values: any) => {
    if (items.length === 0) {
      message.warning('请先添加商品');
      return;
    }
    if (!selectedLogistics) {
      message.warning('请先计算并选择物流方案');
      return;
    }
    setLoading(true);
    try {
      await orderAPI.createOrder({
        items: items.map(i => ({
          productId: i.productId,
          specification: i.specification,
          quantity: i.quantity,
        })),
        logisticsType: selectedLogistics,
        deliveryAddress: values.deliveryAddress,
        remark: values.remark,
        useCredit: values.useCredit,
      });
      message.success('订单创建成功');
      navigate('/orders');
    } catch (error: any) {
      message.error(error.response?.data?.message || '创建订单失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card title="创建采购订单">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={24}>
            <Col span={14}>
              <Card
                title="添加商品"
                size="small"
                extra={
                  <Select
                    showSearch
                    placeholder="搜索并添加商品"
                    style={{ width: 300 }}
                    onSearch={handleSearchProducts}
                    filterOption={false}
                    onChange={(_, option) => {
                      const opt = option as any;
                      const product = products.find(p => p._id === opt?.value);
                      if (product) addItem(product);
                    }}
                  >
                    {products.map(p => (
                      <Option key={p._id} value={p._id}>
                        {p.name} - ¥{p.price}/{p.unit}
                      </Option>
                    ))}
                  </Select>
                }
              >
                {items.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                    暂无商品，请在上方搜索并添加
                  </div>
                ) : (
                  <List
                    dataSource={items}
                    renderItem={(item, index) => (
                      <List.Item
                        actions={[
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeItem(index)}
                          />,
                        ]}
                      >
                        <List.Item.Meta
                          title={item.productName}
                          description={
                            <Space>
                              <Select
                                value={item.specification}
                                onChange={(value) => updateItem(index, 'specification', value)}
                                style={{ width: 120 }}
                                size="small"
                              >
                                {item.specifications?.map((spec: string) => (
                                  <Option key={spec} value={spec}>{spec}</Option>
                                ))}
                              </Select>
                              <InputNumber
                                min={1}
                                value={item.quantity}
                                onChange={(value) => updateItem(index, 'quantity', value || 1)}
                                size="small"
                                style={{ width: 100 }}
                              />
                              <span>{item.unit}</span>
                              <Tag color="orange">¥{item.price}/{item.unit}</Tag>
                              <span style={{ fontWeight: 'bold', color: '#fa8c16' }}>
                                小计：¥{(item.price * item.quantity).toFixed(2)}
                              </span>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
                {items.length > 0 && (
                  <div style={{ textAlign: 'right', marginTop: 16, fontSize: 18 }}>
                    商品总额：<span style={{ color: '#fa8c16', fontWeight: 'bold' }}>¥{calculateTotal().toFixed(2)}</span>
                  </div>
                )}
              </Card>
            </Col>

            <Col span={10}>
              <Card title="配送信息" size="small">
                <Form.Item
                  name="deliveryAddress"
                  label="收货地址"
                  rules={[{ required: true, message: '请输入收货地址' }]}
                >
                  <TextArea rows={3} placeholder="请输入详细收货地址" />
                </Form.Item>

                <Form.Item name="useCredit" label="账期支付" valuePropName="checked">
                  <Select>
                    <Option value={false}>立即支付</Option>
                    <Option value={true}>使用信用额度</Option>
                  </Select>
                </Form.Item>

                <Form.Item name="remark" label="备注">
                  <TextArea rows={2} placeholder="订单备注（选填）" />
                </Form.Item>
              </Card>

              <Card title="物流方案" size="small" style={{ marginTop: 16 }} extra={
                <Button type="link" onClick={handleCalculateLogistics}>计算方案</Button>
              }>
                {logisticsRecommendations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                    点击上方按钮计算物流方案
                  </div>
                ) : (
                  <List
                    dataSource={logisticsRecommendations}
                    renderItem={(item: any) => (
                      <List.Item
                        onClick={() => setSelectedLogistics(item.type)}
                        style={{
                          cursor: 'pointer',
                          border: selectedLogistics === item.type ? '2px solid #52c41a' : '1px solid #f0f0f0',
                          borderRadius: 4,
                          marginBottom: 8,
                          padding: 12,
                        }}
                      >
                        <List.Item.Meta
                          title={
                            <Space>
                              <span style={{ fontWeight: 'bold' }}>{item.name}</span>
                              <Tag color="green">推荐</Tag>
                            </Space>
                          }
                          description={
                            <div>
                              <div>预计费用：<span style={{ color: '#fa8c16', fontWeight: 'bold' }}>¥{item.estimatedCost.toFixed(2)}</span></div>
                              <div>预计时效：{item.estimatedTime}</div>
                              <div style={{ fontSize: 12, color: '#999' }}>{item.description}</div>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Card>
            </Col>
          </Row>

          <Divider />

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => navigate(-1)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                提交订单
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default CreateOrder;
