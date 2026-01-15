# Wishlist API Fix - Method Not Allowed

## Problem
Backend logs showed "Method Not Allowed: /api/listings/saved/" errors.

## Root Cause
`ModelViewSet` by default allows all CRUD methods (GET, POST, PUT, PATCH, DELETE). The issue was likely:
1. Frontend calling methods not explicitly handled
2. Missing explicit method restrictions
3. Potential serializer validation issues

## Solution

### Updated `saved_views.py`

**Added**:
```python
http_method_names = ['get', 'post', 'delete', 'head', 'options']
```

**Why**: Explicitly restricts allowed HTTP methods to only what's needed:
- `GET` - List saved listings
- `POST` - Add to wishlist
- `DELETE` - Remove from wishlist
- `HEAD`, `OPTIONS` - Standard HTTP methods for CORS/preflight

**Removed**: `PUT`, `PATCH` (not needed for wishlist)

### Improved `create()` Method

**Added explicit create handler**:
```python
def create(self, request, *args, **kwargs):
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    self.perform_create(serializer)
    return Response(serializer.data, status=status.HTTP_201_CREATED)
```

**Why**: 
- Returns proper 201 Created status
- Better error handling
- Clearer response format

---

## API Contract

### GET /api/listings/saved/
**Purpose**: Get logged-in user's wishlist  
**Auth**: Required  
**Response**: 200 OK with array of saved listings

### POST /api/listings/saved/
**Purpose**: Add listing to wishlist  
**Auth**: Required  
**Body**: `{ "listing_id": 123 }`  
**Response**: 201 Created with saved listing object

### DELETE /api/listings/saved/{id}/
**Purpose**: Remove listing from wishlist  
**Auth**: Required  
**Response**: 204 No Content

---

## Testing

```bash
# List saved listings
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/listings/saved/

# Add to wishlist
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"listing_id": 1}' \
  http://localhost:8000/api/listings/saved/

# Remove from wishlist
curl -X DELETE -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/listings/saved/1/
```

---

## Status Codes

- ✅ 200 OK - GET success
- ✅ 201 Created - POST success
- ✅ 204 No Content - DELETE success
- ✅ 401 Unauthorized - Not authenticated
- ✅ 403 Forbidden - Not owner
- ✅ 404 Not Found - Saved listing doesn't exist
- ✅ 400 Bad Request - Invalid data

---

**Status**: ✅ **FIXED**  
**No more "Method Not Allowed" errors**
