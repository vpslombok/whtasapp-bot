<?php
include 'db.php';

// Ambil data dari database termasuk id
$query = "SELECT id, ip, latitude, longitude, location FROM user_access";
$result = $conn->query($query);

// hapus data yang dipilih
if (isset($_POST['hapus'])) {
    $id = $_POST['checked'];
    foreach ($id as $id) {
        $query = "DELETE FROM user_access WHERE id = '$id'";
        $conn->query($query);
    }
}
?>

<?php include 'layout/header.php'; ?>
<?php include 'layout/sidebar.php'; ?>

<div class="content">
    <div class="form-akses">
        <h2>Data Akses Pengguna</h2>
        <div class="table-responsive">
            <form action="web_akses.php" method="post">
                <table class="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th><input type="checkbox" id="selectAll"></th>
                            <th>No</th>
                            <th>IP</th>
                            <th>Latitude</th>
                            <th>Longitude</th>
                            <th>Lokasi</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $no = 1;
                        if (mysqli_num_rows($result) > 0) {
                            while ($akses = mysqli_fetch_array($result)) {
                                echo "<tr>";
                                echo "<td><input type='checkbox' name='checked[]' value='" . $akses['id'] . "'></td>";
                                echo "<td>" . $no++ . "</td>";
                                echo "<td>" . $akses['ip'] . "</td>";
                                echo "<td>" . $akses['latitude'] . "</td>";
                                echo "<td>" . $akses['longitude'] . "</td>";
                                echo "<td>" . $akses['location'] . "</td>";
                                echo "<td><a href='web_akses.php?id=" . $akses['id'] . "' class='btn btn-danger'>Hapus</a></td>";
                                echo "</tr>";
                            }
                        } else {
                            echo "<tr><td colspan='6'>Tidak ada data akses pengguna.</td></tr>";
                        }
                        ?>
                    </tbody>
                </table>
                <button type="submit" name="hapus" class="btn btn-primary">Hapus yang Dipilih</button>
            </form>
        </div>
    </div>
</div>

</body>
<script>
    $(document).ready(function() {
        $('#selectAll').click(function() {
            $('input[name="checked[]"]').prop('checked', this.checked);
        });
    });


</script>

</html>