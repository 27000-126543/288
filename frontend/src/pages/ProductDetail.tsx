import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Image,
  Descriptions,
  Button,
  Tag,
  InputNumber,
  Select,
  message,
  Spin,
  Divider,
  List,
} from 'antd';
import { ShoppingCartOutlined, StarOutlined, SafetyOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI, orderAPI } from '../services/api';

const { Option } = Select;

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [specification, setSpecification] = useState('');
  const [logisticsRecommendations, setLogisticsRecommendations] = useState<any[]>([]);
  const [selectedLogistics, setSelectedLogistics] = useState('');

  useEffect(() => {
    if (id) loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const { data } = await productAPI.getProduct(id!);
      setProduct(data);
      if (data.specifications?.length) {
        setSpecification(data.specifications[0]);
      }
    } catch (error) {
      message.error('加载商品详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      const { data } = await orderAPI.getLogisticsRecommendations({
        productIds: [id],
        quantities: [quantity],
      });
      setLogisticsRecommendations(data.recommendations || []);
      if (data.recommendations?.length) {
        setSelectedLogistics(data.recommendations[0].type);
      }
      message.success('已计算物流方案');
    } catch (error) {
      message.error('计算物流方案失败');
    }
  };

  const handleCreateOrder = async () => {
    try {
      await orderAPI.createOrder({
        items: [{ productId: id, specification, quantity }],
        logisticsType: selectedLogistics,
        deliveryAddress: '默认地址',
        useCredit: false,
      });
      message.success('订单创建成功');
      navigate('/orders');
    } catch (error: any) {
      message.error(error.response?.data?.message || '创建订单失败');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!product) {
    return <div>商品不存在</div>;
  }

  const inspectionStatusMap: Record<string, { color: string; text: string }> = {
    passed: { color: 'green', text: '检测合格' },
    pending: { color: 'gold', text: '待检测' },
    failed: { color: 'red', text: '检测不合格' },
  };

  return (
    <div>
      <Card>
        <Row gutter={24}>
          <Col span={10}>
            <div style={{
              height: 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f5f5f5',
              fontSize: 120,
              borderRadius: 8,
            }}>
              🥬
            </div>
          </Col>
          <Col span={14}>
            <Tag color={inspectionStatusMap[product.inspectionStatus]?.color}>
              <SafetyOutlined /> {inspectionStatusMap[product.inspectionStatus]?.text}
            </Tag>
            <h1 style={{ fontSize: 28, margin: '16px 0' }}>{product.name}</h1>
            <Tag color="blue">{product.category}</Tag>
            <div style={{ margin: '16px 0', fontSize: 32, color: '#fa8c16', fontWeight: 'bold' }}>
              ¥{product.price}
              <span style={{ fontSize: 16, color: '#999', marginLeft: 8 }}>/{product.unit}</span>
            </div>

            <Divider />

            <Descriptions column={1} size="small">
              <Descriptions.Item label="产地">
                <EnvironmentOutlined /> {product.origin}
              </Descriptions.Item>
              <Descriptions.Item label="仓库">{product.warehouse}</Descriptions.Item>
              <Descriptions.Item label="库存">
                {product.stock} {product.unit}
                {product.stock < 10 && <Tag color="red" style={{ marginLeft: 8 }}>库存紧张</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="保质期">{product.shelfLife}天</Descriptions.Item>
              <Descriptions.Item label="生产时间">{new Date(product.productionDate).toLocaleDateString()}</Descriptions.Item>
              <Descriptions.Item label="商户">
                {product.merchantId?.companyName || product.merchantId?.username}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <div style={{ marginBottom: 16 }}>
              <span style={{ marginRight: 12 }}>规格：</span>
              <Select
                value={specification}
                onChange={setSpecification}
                style={{ width: 200 }}
              >
                {product.specifications?.map((spec: string) => (
                  <Option key={spec} value={spec}>{spec}</Option>
                ))}
              </Select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <span style={{ marginRight: 12 }}>数量：</span>
              <InputNumber
                min={1}
                max={product.stock}
                value={quantity}
                onChange={setQuantity}
                style={{ width: 120 }}
              />
              <span style={{ marginLeft: 8, color: '#999' }}>{product.unit}</span>
            </div>

            {logisticsRecommendations.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ marginRight: 12 }}>物流：</span>
                <Select
                  value={selectedLogistics}
                  onChange={setSelectedLogistics}
                  style={{ width: 300 }}
                >
                  {logisticsRecommendations.map((item: any) => (
                    <Option key={item.type} value={item.type}>
                      {item.name} - ¥{item.estimatedCost.toFixed(2)} ({item.estimatedTime})
                    </Option>
                  ))}
                </Select>
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <Button type="primary" size="large" icon={<ShoppingCartOutlined />} onClick={handleAddToCart}>
                计算物流
              </Button>
              {logisticsRecommendations.length > 0 && (
                <Button
                  type="primary"
                  size="large"
                  style={{ marginLeft: 12, background: '#fa8c16' }}
                  onClick={handleCreateOrder}
                >
                  立即下单
                </Button>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="商品描述" style={{ marginTop: 16 }}>
        <p>{product.description}</p>
      </Card>

      {product.traceCode && (
        <Card title="食品安全追溯" style={{ marginTop: 16 }}>
          <p>追溯码：<Tag color="green">{product.traceCode}</Tag></p>
          <Button type="link">点击查看完整检测报告</Button>
        </Card>
      )}
    </div>
  );
};

export default ProductDetail;
