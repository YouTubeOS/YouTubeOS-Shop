import { useEffect, useState } from 'react'
import { supabase } from './supabase'


function Admin({
  onClose,
  onProductsChanged,
}) {

  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])

  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [stock, setStock] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const [openOrder, setOpenOrder] = useState(null)

  const [trackNumbers, setTrackNumbers] = useState({})

  const [editingProduct, setEditingProduct] = useState(null)



  async function loadProducts() {

    setLoading(true)

    const {
      data,
      error
    } = await supabase
      .from('products')
      .select('*')
      .order(
        'created_at',
        {
          ascending:false
        }
      )


    if(error){
      setMessage(error.message)
    } else {
      setProducts(data || [])
    }

    setLoading(false)
  }




  async function loadOrders(){

    setOrdersLoading(true)

    const {
      data,
      error
    } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .order(
        'created_at',
        {
          ascending:false
        }
      )


    if(error){
      setMessage(error.message)
    } else {
      setOrders(data || [])
    }

    setOrdersLoading(false)

  }




  useEffect(()=>{

    loadProducts()
    loadOrders()

  },[])





  async function updateOrderStatus(
    id,
    status
  ){

    const {
      error
    } = await supabase
      .from('orders')
      .update({
        status
      })
      .eq(
        'id',
        id
      )


    if(error){
      alert(error.message)
      return
    }


    loadOrders()

  }





  async function saveTrack(id){

    const track =
      trackNumbers[id]


    const {
      error
    } = await supabase
      .from('orders')
      .update({
        cdek_track:track
      })
      .eq(
        'id',
        id
      )


    if(error){
      alert(error.message)
      return
    }


    alert(
      'Трек сохранён ✅'
    )


    loadOrders()

  }
    async function addProduct(e){

    e.preventDefault()

    if(saving) return

    setSaving(true)


    const {
      error
    } = await supabase
      .from('products')
      .insert({

        name:name.trim(),

        description:
          description.trim() || null,

        price:Number(price),

        category:
          category.trim() || null,

        stock:Number(stock),

        image_url:
          imageUrl.trim() || null

      })


    if(error){

      setMessage(error.message)

      setSaving(false)

      return
    }



    setName('')
    setDescription('')
    setPrice('')
    setCategory('')
    setStock('')
    setImageUrl('')


    setMessage(
      'Товар добавлен ✅'
    )


    loadProducts()


    if(onProductsChanged){
      onProductsChanged()
    }


    setSaving(false)

  }





  async function updateProduct(){

    const {
      error
    } = await supabase
      .from('products')
      .update({

        name:
          editingProduct.name,

        description:
          editingProduct.description,

        price:
          Number(editingProduct.price),

        category:
          editingProduct.category,

        stock:
          Number(editingProduct.stock),

        image_url:
          editingProduct.image_url

      })
      .eq(
        'id',
        editingProduct.id
      )


    if(error){

      alert(error.message)

      return
    }



    setEditingProduct(null)


    await loadProducts()


    if(onProductsChanged){
      onProductsChanged()
    }


  }





  async function deleteProduct(id){


    if(!confirm(
      'Удалить товар?'
    )) return



    const {
      error
    } = await supabase
      .from('products')
      .delete()
      .eq(
        'id',
        id
      )


    if(error){

      alert(error.message)

      return
    }


    loadProducts()


    if(onProductsChanged){
      onProductsChanged()
    }


  }





return (

<div className="admin-overlay">

<div className="admin-panel">


<div className="admin-header">


<div>

<p className="section-label">
PONY&MUSIC
</p>


<h2>
Админка
</h2>


</div>


<button
className="close-button"
onClick={onClose}
>
×
</button>


</div>



<div className="admin-content">


<section>

<p className="section-label">
ДОБАВИТЬ ТОВАР
</p>


<form
className="admin-form"
onSubmit={addProduct}
>


<input
placeholder="Название"
value={name}
onChange={
e=>setName(e.target.value)
}
required
/>


<textarea
placeholder="Описание"
value={description}
onChange={
e=>setDescription(e.target.value)
}
/>


<input
type="number"
placeholder="Цена"
value={price}
onChange={
e=>setPrice(e.target.value)
}
required
/>


<input
type="number"
placeholder="Количество"
value={stock}
onChange={
e=>setStock(e.target.value)
}
required
/>


<input
placeholder="Категория"
value={category}
onChange={
e=>setCategory(e.target.value)
}
/>


<input
placeholder="Ссылка изображения"
value={imageUrl}
onChange={
e=>setImageUrl(e.target.value)
}
/>


{message &&

<div className="admin-message">
{message}
</div>

}


<button
className="admin-add-button"
disabled={saving}
>

{
saving
?
'Добавление...'
:
'Добавить товар'
}

</button>


</form>


</section>
<section className="admin-list-section">

<p className="section-label">
ЗАКАЗЫ
</p>


{
ordersLoading ?

<div className="admin-empty">
Загрузка заказов...
</div>

:

orders.length===0 ?

<div className="admin-empty">
Заказов нет
</div>

:

<div className="admin-products">


{
orders.map(order=>(


<div
className="admin-product"
key={order.id}
>


<div className="admin-product-info">


<strong>
📦 {order.order_number}
</strong>


<span>
{order.total} ₽
</span>


<small>
👤 {order.customer_name}
</small>


<small>
📧 {order.customer_email || 'нет'}
</small>


<small>
  💳 {order.payment_status === 'paid'
    ? 'Оплачено'
    : 'Ожидает оплаты'}
</small>

<button
  type="button"
  onClick={async () => {
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: 'paid' })
      .eq('id', order.id)

    if (error) {
      alert('Ошибка обновления оплаты')
      console.error(error)
      return
    }

    alert('Оплата отмечена как оплаченная')
    loadOrders()
  }}
>
  💰 Оплачено
</button>

<small>
  Статус: {
    order.status === 'В обработке'
      ? 'В обработке'
      : order.status === 'Отправлен'
        ? 'Отправлен'
        : order.status === 'Завершён'
          ? 'Завершён'
          : order.status
  }
</small>



<div className="order-buttons">

<button
onClick={() =>
updateOrderStatus(
order.id,
'В обработке'
)
}
>
В обработке
</button>


<button
onClick={() =>
updateOrderStatus(
order.id,
'Отправлен'
)
}
>
Отправлен
</button>


<button
onClick={() =>
updateOrderStatus(
order.id,
'Завершён'
)
}
>
Завершён
</button>

</div>



<button
className="admin-add-button"
onClick={() =>
setOpenOrder(
openOrder === order.id
?
null
:
order.id
)
}
>
{
openOrder === order.id
?
'Скрыть заказ'
:
'Открыть заказ'
}

</button>




{
openOrder===order.id &&

<div className="order-card">


<h3>
Детали заказа
</h3>


<p>
🚚 Доставка СДЭК
</p>


<input
placeholder="Трек СДЭК"
value={
trackNumbers[order.id]
||
order.cdek_track
||
''
}
onChange={
e =>
setTrackNumbers({

...trackNumbers,

[order.id]:
e.target.value

})
}
/>


<button
className="admin-add-button"
onClick={() =>
saveTrack(order.id)
}
>
Сохранить трек
</button>


<h4>
Товары:
</h4>


{
order.order_items?.map(item=>(

<div key={item.id}>

{item.product_name}

<br/>

Количество:
{item.quantity}

<br/>

Цена:
{item.price} ₽

<hr/>

</div>

))
}


</div>

}


</div>


</div>


))
}


</div>

}

</section>





{
editingProduct &&

<div className="order-card">

<h3>
Редактирование товара
</h3>


<input
value={editingProduct.name}
onChange={
e =>
setEditingProduct({

...editingProduct,

name:e.target.value

})
}
/>


<textarea
value={
editingProduct.description || ''
}
onChange={
e =>
setEditingProduct({

...editingProduct,

description:e.target.value

})
}
/>


<input
type="number"
value={editingProduct.price}
onChange={
e =>
setEditingProduct({

...editingProduct,

price:e.target.value

})
}
/>


<input
type="number"
value={editingProduct.stock}
onChange={
e =>
setEditingProduct({

...editingProduct,

stock:e.target.value

})
}
/>


<input
value={
editingProduct.image_url || ''
}
onChange={
e =>
setEditingProduct({

...editingProduct,

image_url:e.target.value

})
}
/>


<button
className="admin-add-button"
onClick={updateProduct}
>
Сохранить
</button>


<button
onClick={() =>
setEditingProduct(null)
}
>
Отмена
</button>


</div>

}





<section className="admin-list-section">


<p className="section-label">
ТОВАРЫ
</p>



{
loading ?

<div className="admin-empty">
Загрузка...
</div>


:

products.length===0 ?

<div className="admin-empty">
Товаров нет
</div>


:

<div className="admin-products">


{
products.map(product=>(


<div
className="admin-product"
key={product.id}
>


<div className="admin-product-info">


<strong>
{product.name}
</strong>


<span>
{product.price} ₽
</span>


<small>
Остаток: {product.stock}
</small>


</div>



<button
className="admin-add-button"
onClick={() =>
setEditingProduct({
...product
})
}
>
✏️ Изменить
</button>



<button
className="admin-delete-button"
onClick={() =>
deleteProduct(product.id)
}
>
Удалить
</button>


</div>


))
}


</div>

}


</section>


</div>

</div>

</div>

)

}


export default Admin